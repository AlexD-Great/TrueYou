import Bool "mo:base/Bool";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import HashMap "mo:map/Map";
import { phash; thash } "mo:map/Map";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Option "mo:base/Option";
import IC "ic:aaaaa-aa";
import Sha256 "mo:sha2/Sha256";
import Base16 "mo:base16/Base16";
import Cycles "mo:base/ExperimentalCycles";

persistent actor Filevault {
  
  transient let key_name = "dfx_test_key"; // Use "key_1" for production and "dfx_test_key" locally test_key_1

  public func get_ecdsa_public_key() : async Text {
    let { public_key } = await IC.ecdsa_public_key({
      canister_id = null;
      derivation_path = [];
      key_id = { curve = #secp256k1; name = key_name };
    });
    Base16.encode(public_key);
  };

  public func sign_message_with_ecdsa(message : Text) : async Text {
    let message_hash : Blob = Sha256.fromBlob(#sha256, Text.encodeUtf8(message));
    Cycles.add<system>(25_000_000_000);
    let { signature } = await IC.sign_with_ecdsa({
      message_hash;
      derivation_path = [];
      key_id = { curve = #secp256k1; name = key_name };
    });
    Base16.encode(signature);
  };

  public func get_schnorr_public_key() : async Text {
    let { public_key } = await IC.schnorr_public_key({
      canister_id = null;
      derivation_path = [];
      key_id = { algorithm = #ed25519; name = key_name };
    });
    Base16.encode(public_key);
  };

  public func sign_message_with_schnorr(message : Text) : async Text {
    Cycles.add<system>(25_000_000_000);
    let { signature } = await IC.sign_with_schnorr({
      message = Text.encodeUtf8(message);
      derivation_path = [];
      key_id = { algorithm = #ed25519; name = key_name };
      aux = null;
    });
    Base16.encode(signature);
  };

  // Define a data type for a file's chunks.
  type FileChunk = {
    chunk : Blob;
    index : Nat;
  };

  // Define a data type for a file's data.
  type File = {
    name : Text;
    chunks : [FileChunk];
    totalSize : Nat;
    fileType : Text;
    ecdsa_sign: Text;
    schnorr_sign: Text;
  };

  // Define a data type for storing files associated with a user principal.
  type UserFiles = HashMap.Map<Text, File>;

  // HashMap to store the user data
  private var files = HashMap.new<Principal, UserFiles>();

  // Return files associated with a user's principal.
  private func getUserFiles(user : Principal) : UserFiles {
    switch (HashMap.get(files, phash, user)) {
      case null {
        let newFileMap = HashMap.new<Text, File>();
        let _ = HashMap.put(files, phash, user, newFileMap);
        newFileMap;
      };
      case (?existingFiles) existingFiles;
    };
  };

  // Check if a file name already exists for the user.
  public shared (msg) func checkFileExists(name : Text) : async Bool {
    Option.isSome(HashMap.get(getUserFiles(msg.caller), thash, name));
  };

  // Upload a file in chunks.
  public shared (msg) func uploadFileChunk(name : Text, chunk : Blob, index : Nat, fileType : Text) : async () {
    let userFiles = getUserFiles(msg.caller);
    let fileChunk = { chunk = chunk; index = index };
    // Await the results of the signing functions
    let ecdsaSignature = await sign_message_with_ecdsa(name);
    let schnorrSignature = await sign_message_with_schnorr(name);

    switch (HashMap.get(userFiles, thash, name)) {
      case null {
        let _ = HashMap.put(userFiles, thash, name, { name = name; chunks = [fileChunk]; totalSize = chunk.size(); fileType = fileType;ecdsa_sign = ecdsaSignature; schnorr_sign = schnorrSignature; });
      };
      case (?existingFile) {
        let updatedChunks = Array.append(existingFile.chunks, [fileChunk]);
        let _ = HashMap.put(
          userFiles,
          thash,
          name,
          {
            name = name;
            chunks = updatedChunks;
            totalSize = existingFile.totalSize + chunk.size();
            fileType = fileType;
            ecdsa_sign = ecdsaSignature;
            schnorr_sign = schnorrSignature;
          }
        );
      };
    };
  };

  // Return list of files for a user.
  public shared (msg) func getFiles() : async [{ name : Text; size : Nat; fileType : Text; ecdsa_sign: Text; schnorr_sign: Text; }] {
    Iter.toArray(
      Iter.map(
        HashMap.vals(getUserFiles(msg.caller)),
        func(file : File) : { name : Text; size : Nat; fileType : Text; ecdsa_sign: Text; schnorr_sign: Text; } {
          {
            name = file.name;
            size = file.totalSize;
            fileType = file.fileType;
            ecdsa_sign = file.ecdsa_sign; 
            schnorr_sign = file.schnorr_sign;
          };
        }
      )
    );
  };

  // Return total chunks for a file
  public shared (msg) func getTotalChunks(name : Text) : async Nat {
    switch (HashMap.get(getUserFiles(msg.caller), thash, name)) {
      case null 0;
      case (?file) file.chunks.size();
    };
  };

  // Return specific chunk for a file.
  public shared (msg) func getFileChunk(name : Text, index : Nat) : async ?Blob {
    switch (HashMap.get(getUserFiles(msg.caller), thash, name)) {
      case null null;
      case (?file) {
        switch (Array.find(file.chunks, func(chunk : FileChunk) : Bool { chunk.index == index })) {
          case null null;
          case (?foundChunk) ?foundChunk.chunk;
        };
      };
    };
  };

  // Get file's type.
  public shared (msg) func getFileType(name : Text) : async ?Text {
    switch (HashMap.get(getUserFiles(msg.caller), thash, name)) {
      case null null;
      case (?file) ?file.fileType;
    };
  };

  // Delete a file.
  public shared (msg) func deleteFile(name : Text) : async Bool {
    Option.isSome(HashMap.remove(getUserFiles(msg.caller), thash, name));
  };

  // public func sign_file_with_schnorr(message : [{ name : Text; size : Nat; fileType : Text; ecdsa_sign: Text; schnorr_sign: Text; }]) : async Text {
  //   let gottenFiles = await getFiles();
  //   Cycles.add<system>(25_000_000_000);
  //   let { signature } = await IC.sign_with_schnorr({
  //     message = gottenFiles;
  //     derivation_path = [];
  //     key_id = { algorithm = #ed25519; name = key_name };
  //     aux = null;
  //   });
  //   Base16.encode(signature);
  // };
};
