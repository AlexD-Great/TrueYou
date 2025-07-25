import Bool "mo:base/Bool";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import HashMap "mo:map/Map";
import { phash; thash; nhash } "mo:map/Map";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Option "mo:base/Option";
import IC "ic:aaaaa-aa";
import Sha256 "mo:sha2/Sha256";
import Base16 "mo:base16/Base16";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Int "mo:base/Int";

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

  // Define verification request status
  type RequestStatus = {
    #pending;
    #approved;
    #rejected;
  };

  // Define a data type for verification requests
  type VerificationRequest = {
    id: Text;
    requester: Principal;
    holder: Principal;
    credentialName: Text;
    requestMessage: Text;
    status: RequestStatus;
    createdAt: Int;
  };

  // Define a data type for verification responses
  type VerificationResponse = {
    requestId: Text;
    approved: Bool;
    credentialData: ?{
      name: Text;
      fileType: Text;
      size: Nat;
      ecdsa_sign: Text;
      schnorr_sign: Text;
    };
    responseMessage: Text;
    respondedAt: Int;
  };

  // Define NFT metadata structure
  type NFTMetadata = {
    name: Text;
    description: Text;
    image: Text;
    attributes: [(Text, Text)];
    created_at: Int;
    creator: Principal;
  };

  // Define NFT structure
  type NFT = {
    id: Nat;
    owner: Principal;
    metadata: NFTMetadata;
    signature: Text;
    minted_at: Int;
  };

  // Define user roles
  type UserRole = {
    #admin;
    #verifier;
    #reviewer;
    #user;
  };

  // Define admin configuration
  type AdminConfig = {
    principal: Principal;
    role: UserRole;
    assignedBy: Principal;
    assignedAt: Int;
    isActive: Bool;
  };

  // Define pooled verification request status
  type PooledRequestStatus = {
    #unverified;
    #claimed;
    #verified;
    #rejected;
  };

  // Define pooled verification request
  type PooledVerificationRequest = {
    id: Text;
    submitter: Principal;
    credentialName: Text;
    requestMessage: Text;
    status: PooledRequestStatus;
    submittedAt: Int;
    claimedBy: ?Principal;
    claimedAt: ?Int;
    processedAt: ?Int;
    verifierResponse: ?Text;
  };

  // HashMap to store the user data
  private var files = HashMap.new<Principal, UserFiles>();

  // HashMap to store verification requests
  private var verificationRequests = HashMap.new<Text, VerificationRequest>();

  // HashMap to store verification responses
  private var verificationResponses = HashMap.new<Text, VerificationResponse>();

  // Storage for NFTs
  private var nfts = HashMap.new<Nat, NFT>();
  private var userNFTs = HashMap.new<Principal, [Nat]>();
  private var nextNFTId : Nat = 1;
  // Track which credentials already have NFTs (Principal + CredentialName -> NFT ID)
  private var credentialNFTs = HashMap.new<Text, Nat>();

  // Admin role management
  private var userRoles = HashMap.new<Principal, AdminConfig>();
  private var superAdmins = HashMap.new<Principal, Bool>();

  // Storage for pooled verification requests
  private var pooledVerificationRequests = HashMap.new<Text, PooledVerificationRequest>();
  private stable var nextPooledRequestId : Nat = 1;


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

  // Helper function to generate unique request ID
  private func generateRequestId(requester: Principal, holder: Principal, credentialName: Text) : Text {
    let timestamp = Time.now();
    Principal.toText(requester) # "_" # Principal.toText(holder) # "_" # credentialName # "_" # Int.toText(timestamp);
  };

  // Create a verification request
  public shared (msg) func createVerificationRequest(holder: Principal, credentialName: Text, requestMessage: Text) : async Text {
    let requestId = generateRequestId(msg.caller, holder, credentialName);
    let request : VerificationRequest = {
      id = requestId;
      requester = msg.caller;
      holder = holder;
      credentialName = credentialName;
      requestMessage = requestMessage;
      status = #pending;
      createdAt = Time.now();
    };
    
    let _ = HashMap.put(verificationRequests, thash, requestId, request);
    requestId;
  };

  // Get verification requests for a holder
  public shared (msg) func getVerificationRequests() : async [VerificationRequest] {
    let requests = HashMap.vals(verificationRequests);
    Iter.toArray(
      Iter.filter(requests, func(req : VerificationRequest) : Bool {
        req.holder == msg.caller
      })
    );
  };

  // Get verification requests sent by a requester
  public shared (msg) func getSentVerificationRequests() : async [VerificationRequest] {
    let requests = HashMap.vals(verificationRequests);
    Iter.toArray(
      Iter.filter(requests, func(req : VerificationRequest) : Bool {
        req.requester == msg.caller
      })
    );
  };

  // Approve a verification request
  public shared (msg) func approveVerificationRequest(requestId: Text, responseMessage: Text) : async Bool {
    switch (HashMap.get(verificationRequests, thash, requestId)) {
      case null false;
      case (?request) {
        if (request.holder != msg.caller) {
          return false;
        };
        
        // Update request status
        let updatedRequest = {
          request with status = #approved;
        };
        let _ = HashMap.put(verificationRequests, thash, requestId, updatedRequest);
        
        // Get credential data
        let credentialData = switch (HashMap.get(getUserFiles(msg.caller), thash, request.credentialName)) {
          case null null;
          case (?file) {
            ?{
              name = file.name;
              fileType = file.fileType;
              size = file.totalSize;
              ecdsa_sign = file.ecdsa_sign;
              schnorr_sign = file.schnorr_sign;
            };
          };
        };
        
        // Create response
        let response : VerificationResponse = {
          requestId = requestId;
          approved = true;
          credentialData = credentialData;
          responseMessage = responseMessage;
          respondedAt = Time.now();
        };
        
        let _ = HashMap.put(verificationResponses, thash, requestId, response);
        true;
      };
    };
  };

  // Reject a verification request
  public shared (msg) func rejectVerificationRequest(requestId: Text, responseMessage: Text) : async Bool {
    switch (HashMap.get(verificationRequests, thash, requestId)) {
      case null false;
      case (?request) {
        if (request.holder != msg.caller) {
          return false;
        };
        
        // Update request status
        let updatedRequest = {
          request with status = #rejected;
        };
        let _ = HashMap.put(verificationRequests, thash, requestId, updatedRequest);
        
        // Create response
        let response : VerificationResponse = {
          requestId = requestId;
          approved = false;
          credentialData = null;
          responseMessage = responseMessage;
          respondedAt = Time.now();
        };
        
        let _ = HashMap.put(verificationResponses, thash, requestId, response);
        true;
      };
    };
  };

  // Get verification response
  public shared (msg) func getVerificationResponse(requestId: Text) : async ?VerificationResponse {
    switch (HashMap.get(verificationRequests, thash, requestId)) {
      case null null;
      case (?request) {
        if (request.requester != msg.caller) {
          return null;
        };
        HashMap.get(verificationResponses, thash, requestId);
      };
    };
  };

  // Get all verification responses for a requester
  public shared (msg) func getVerificationResponses() : async [VerificationResponse] {
    let responses = HashMap.vals(verificationResponses);
    
    Iter.toArray(
      Iter.filter(responses, func(resp : VerificationResponse) : Bool {
        switch (HashMap.get(verificationRequests, thash, resp.requestId)) {
          case null false;
          case (?request) request.requester == msg.caller;
        };
      })
    );
  };

  // ==== POOLED VERIFICATION FUNCTIONS ====

  // Submit a credential for verification to the pool
  public shared (msg) func submitVerificationRequest(credentialName: Text, requestMessage: Text) : async Text {
    // Check if user has the credential file
    let userFiles = getUserFiles(msg.caller);
    switch (HashMap.get(userFiles, thash, credentialName)) {
      case null {
        // Return error - credential doesn't exist
        "ERROR: Credential not found";
      };
      case (?_file) {
        // Generate unique request ID
        let requestId = "pool_req_" # Nat.toText(nextPooledRequestId);
        nextPooledRequestId += 1;

        let newRequest : PooledVerificationRequest = {
          id = requestId;
          submitter = msg.caller;
          credentialName = credentialName;
          requestMessage = requestMessage;
          status = #unverified;
          submittedAt = Time.now();
          claimedBy = null;
          claimedAt = null;
          processedAt = null;
          verifierResponse = null;
        };

        let _ = HashMap.put(pooledVerificationRequests, thash, requestId, newRequest);
        
        // Debug: Check if the request was actually stored
        switch (HashMap.get(pooledVerificationRequests, thash, requestId)) {
          case null {
            "ERROR: Failed to store request";
          };
          case (?stored) {
            requestId;
          };
        };
      };
    };
  };

  // Get user's submitted verification requests
  public shared (msg) func getUserSubmittedRequests() : async [PooledVerificationRequest] {
    let requests = HashMap.vals(pooledVerificationRequests);
    
    Iter.toArray(
      Iter.filter(requests, func(req : PooledVerificationRequest) : Bool {
        req.submitter == msg.caller;
      })
    );
  };

  // Get verification pool for verifiers/reviewers (only unverified and claimed by them)
  public shared (msg) func getVerificationPool() : async [PooledVerificationRequest] {
    // For now, allow access to all authenticated users
    // TODO: Implement proper permission checking without blocking async calls

    let requests = HashMap.vals(pooledVerificationRequests);
    
    Iter.toArray(
      Iter.filter(requests, func(req : PooledVerificationRequest) : Bool {
        switch (req.status) {
          case (#unverified) true;
          case (#claimed) {
            switch (req.claimedBy) {
              case (?claimer) claimer == msg.caller;
              case null false;
            };
          };
          case (_) false;
        };
      })
    );
  };

  // Claim a verification request from the pool
  public shared (msg) func claimVerificationRequest(requestId: Text) : async Bool {
    // Check if user is a verifier or reviewer or admin - use direct helper functions
    let userIsVerifier = isVerifier(msg.caller);
    let userIsReviewer = isReviewer(msg.caller);
    let userIsAdmin = isAdmin(msg.caller);
    let hasPermission = userIsVerifier or userIsReviewer or userIsAdmin;
    
    if (not hasPermission) {
      return false;
    };

    switch (HashMap.get(pooledVerificationRequests, thash, requestId)) {
      case null false;
      case (?request) {
        if (request.status == #unverified) {
          let updatedRequest = {
            request with
            status = #claimed;
            claimedBy = ?msg.caller;
            claimedAt = ?Time.now();
          };
          let _ = HashMap.put(pooledVerificationRequests, thash, requestId, updatedRequest);
          true;
        } else {
          false;
        };
      };
    };
  };

  // Debug function to claim a verification request with detailed logging
  public shared (msg) func debugClaimVerificationRequest(requestId: Text) : async Text {
    // Check permissions step by step - use direct helper functions
    let userIsVerifier = isVerifier(msg.caller);
    let userIsReviewer = isReviewer(msg.caller);
    let userIsAdmin = isAdmin(msg.caller);
    let hasPermission = userIsVerifier or userIsReviewer or userIsAdmin;
    
    let result = "Caller: " # Principal.toText(msg.caller) # 
                 " | isVerifier: " # (if userIsVerifier "true" else "false") #
                 " | isReviewer: " # (if userIsReviewer "true" else "false") #
                 " | isAdmin: " # (if userIsAdmin "true" else "false") #
                 " | hasPermission: " # (if hasPermission "true" else "false");
    
    if (not hasPermission) {
      return result # " | FAILED: No permission";
    };

    switch (HashMap.get(pooledVerificationRequests, thash, requestId)) {
      case null {
        result # " | FAILED: Request not found";
      };
      case (?request) {
        let statusText = switch (request.status) {
          case (#unverified) "unverified";
          case (#claimed) "claimed";  
          case (#verified) "verified";
          case (#rejected) "rejected";
        };
        
        if (request.status == #unverified) {
          let updatedRequest = {
            request with
            status = #claimed;
            claimedBy = ?msg.caller;
            claimedAt = ?Time.now();
          };
          let _ = HashMap.put(pooledVerificationRequests, thash, requestId, updatedRequest);
          result # " | SUCCESS: Claimed request with status " # statusText;
        } else {
          result # " | FAILED: Request status is " # statusText # ", not unverified";
        };
      };
    };
  };

  // Process (approve/reject) a claimed verification request
  public shared (msg) func processVerificationRequest(requestId: Text, approved: Bool, verifierResponse: Text) : async Bool {
    // Check if user is a verifier or reviewer or admin - use direct helper functions
    let userIsVerifier = isVerifier(msg.caller);
    let userIsReviewer = isReviewer(msg.caller);
    let userIsAdmin = isAdmin(msg.caller);
    let hasPermission = userIsVerifier or userIsReviewer or userIsAdmin;
    
    if (not hasPermission) {
      return false;
    };

    switch (HashMap.get(pooledVerificationRequests, thash, requestId)) {
      case null false;
      case (?request) {
        // Check if this verifier claimed the request
        switch (request.claimedBy) {
          case (?claimer) {
            if (claimer == msg.caller and request.status == #claimed) {
              let newStatus = if (approved) #verified else #rejected;
              let updatedRequest = {
                request with
                status = newStatus;
                processedAt = ?Time.now();
                verifierResponse = ?verifierResponse;
              };
              let _ = HashMap.put(pooledVerificationRequests, thash, requestId, updatedRequest);
              true;
            } else {
              false;
            };
          };
          case null false;
        };
      };
    };
  };

  // Get all processed verification requests (for admin reporting)
  public shared (msg) func getAllProcessedRequests() : async [PooledVerificationRequest] {
    // Check if user is admin
    let isAdmin = await isCurrentUserAdmin();
    
    if (not isAdmin) {
      return [];
    };

    let requests = HashMap.vals(pooledVerificationRequests);
    
    Iter.toArray(
      Iter.filter(requests, func(req : PooledVerificationRequest) : Bool {
        switch (req.status) {
          case (#verified) true;
          case (#rejected) true;
          case (_) false;
        };
      })
    );
  };

  // Debug function to get ALL pooled requests regardless of status (admin only)
  public shared (msg) func getAllPooledRequestsDebug() : async [PooledVerificationRequest] {
    // Check if user is admin
    let isAdmin = await isCurrentUserAdmin();
    
    if (not isAdmin) {
      return [];
    };

    let requests = HashMap.vals(pooledVerificationRequests);
    Iter.toArray(requests);
  };

  // Debug function to get the count of pooled requests
  public shared (msg) func getPooledRequestsCount() : async Nat {
    // Check if user is admin
    let isAdmin = await isCurrentUserAdmin();
    
    if (not isAdmin) {
      return 0;
    };

    HashMap.size(pooledVerificationRequests);
  };

  // Debug function to get next request ID
  public shared (msg) func getNextRequestId() : async Nat {
    // Check if user is admin
    let isAdmin = await isCurrentUserAdmin();
    
    if (not isAdmin) {
      return 0;
    };

    nextPooledRequestId;
  };

  // Helper function to generate NFT metadata signature
  private func generateNFTSignature(metadata: NFTMetadata) : async Text {
    let metadataText = metadata.name # metadata.description # metadata.image # Principal.toText(metadata.creator);
    await sign_message_with_ecdsa(metadataText);
  };

  // Generate and mint an NFT for a credential
  public shared (msg) func generateCredentialNFT(
    credentialName: Text,
    description: Text,
    imageUrl: Text,
    attributes: [(Text, Text)]
  ) : async ?Nat {
    // Check if user has the credential file
    let userFiles = getUserFiles(msg.caller);
    switch (HashMap.get(userFiles, thash, credentialName)) {
      case null null; // Credential doesn't exist
      case (?_file) {
        // Create unique key for this user's credential
        let credentialKey = Principal.toText(msg.caller) # "_" # credentialName;
        
        // Check if NFT already exists for this credential
        switch (HashMap.get(credentialNFTs, thash, credentialKey)) {
          case (?existingNFTId) {
            // NFT already exists, return the existing ID
            ?existingNFTId;
          };
          case null {
            // No existing NFT, create new one
            let metadata : NFTMetadata = {
              name = "Credential NFT: " # credentialName;
              description = description;
              image = imageUrl;
              attributes = attributes;
              created_at = Time.now();
              creator = msg.caller;
            };

            let signature = await generateNFTSignature(metadata);
            let nftId = nextNFTId;
            nextNFTId += 1;

            let nft : NFT = {
              id = nftId;
              owner = msg.caller;
              metadata = metadata;
              signature = signature;
              minted_at = Time.now();
            };

            // Store the NFT
            let _ = HashMap.put(nfts, nhash, nftId, nft);
            
            // Track that this credential now has an NFT
            let _ = HashMap.put(credentialNFTs, thash, credentialKey, nftId);

            // Update user's NFT list
            let currentNFTs = switch (HashMap.get(userNFTs, phash, msg.caller)) {
              case null [];
              case (?existing) existing;
            };
            let updatedNFTs = Array.append(currentNFTs, [nftId]);
            let _ = HashMap.put(userNFTs, phash, msg.caller, updatedNFTs);

            ?nftId;
          };
        };
      };
    };
  };

  // Get NFT by ID
  public query func getNFT(nftId: Nat) : async ?NFT {
    HashMap.get(nfts, nhash, nftId);
  };

  // Get user's NFTs
  public shared (msg) func getUserNFTs() : async [NFT] {
    switch (HashMap.get(userNFTs, phash, msg.caller)) {
      case null [];
      case (?nftIds) {
        Array.mapFilter<Nat, NFT>(nftIds, func(id) {
          HashMap.get(nfts, nhash, id);
        });
      };
    };
  };

  // Check if a credential already has an NFT
  public shared (msg) func credentialHasNFT(credentialName: Text) : async Bool {
    let credentialKey = Principal.toText(msg.caller) # "_" # credentialName;
    switch (HashMap.get(credentialNFTs, thash, credentialKey)) {
      case (?_nftId) true;
      case null false;
    };
  };

  // Transfer NFT ownership
  public shared (msg) func transferNFT(nftId: Nat, newOwner: Principal) : async Bool {
    switch (HashMap.get(nfts, nhash, nftId)) {
      case null false; // NFT doesn't exist
      case (?nft) {
        if (nft.owner != msg.caller) {
          return false; // Not the owner
        };

        // Update NFT owner
        let updatedNFT = { nft with owner = newOwner };
        let _ = HashMap.put(nfts, nhash, nftId, updatedNFT);

        // Remove from current owner's list
        let currentOwnerNFTs = switch (HashMap.get(userNFTs, phash, msg.caller)) {
          case null [];
          case (?existing) existing;
        };
        let filteredNFTs = Array.filter(currentOwnerNFTs, func(id: Nat) : Bool { id != nftId });
        let _ = HashMap.put(userNFTs, phash, msg.caller, filteredNFTs);

        // Add to new owner's list
        let newOwnerNFTs = switch (HashMap.get(userNFTs, phash, newOwner)) {
          case null [];
          case (?existing) existing;
        };
        let updatedNewOwnerNFTs = Array.append(newOwnerNFTs, [nftId]);
        let _ = HashMap.put(userNFTs, phash, newOwner, updatedNewOwnerNFTs);

        true;
      };
    };
  };

  // Get total NFT supply
  public query func getTotalNFTs() : async Nat {
    nextNFTId - 1;
  };

  // Helper function to check if user has admin privileges
  private func isAdmin(caller: Principal) : Bool {
    let callerText = Principal.toText(caller);
    // Check if caller is one of the special admin identities
    if (callerText == "k2ir2-52b5o-sc6f7-ai4bg-vdrf3-wghtz-xz4us-77lr6-y6cfv-5qlvy-sqe"
      or callerText == "ues2k-6iwxj-nbezb-owlhg-nsem4-abqjc-74ocv-lsxps-ytjv4-2tphv-yqe" 
      or callerText == "mq27q-vc5x3-hjrh3-nm3l5-okbxk-vhv6p-544bn-fej5r-xuwme-jjwez-5ae"
      or callerText == "kiig2-kdtwe-uislq-duqna-4fjhf-syvi3-oqlhi-q6r2r-lbbym-l7qqt-fqe"
    ) {
      // Auto-grant super admin to special identities if not already granted
      switch (HashMap.get(superAdmins, phash, caller)) {
        case null {
          let _ = HashMap.put(superAdmins, phash, caller, true);
          true;
        };
        case (?_) true;
      };
    } else {
      switch (HashMap.get(superAdmins, phash, caller)) {
        case (?true) true;
        case _ {
          switch (HashMap.get(userRoles, phash, caller)) {
            case (?(config)) config.role == #admin and config.isActive;
            case null false;
          };
        };
      };
    };
  };

  // Helper function to check if user has verifier privileges
  private func isVerifier(caller: Principal) : Bool {
    if (isAdmin(caller)) {
      return true;
    };
    switch (HashMap.get(userRoles, phash, caller)) {
      case (?(config)) (config.role == #verifier or config.role == #admin) and config.isActive;
      case null false;
    };
  };

  // Helper function to check if user has reviewer privileges
  private func isReviewer(caller: Principal) : Bool {
    if (isAdmin(caller)) {
      return true;
    };
    switch (HashMap.get(userRoles, phash, caller)) {
      case (?(config)) (config.role == #reviewer or config.role == #admin) and config.isActive;
      case null false;
    };
  };

  // Claim super admin status (only works if no super admin exists)
  public shared (msg) func claimSuperAdmin() : async Bool {
    let hasExistingSuperAdmin = HashMap.size(superAdmins) > 0;
    if (hasExistingSuperAdmin) {
      false;
    } else {
      let _ = HashMap.put(superAdmins, phash, msg.caller, true);
      true;
    };
  };

  // Assign role to a user (admin only)
  public shared (msg) func assignUserRole(userPrincipal: Principal, role: UserRole) : async Bool {
    if (not isAdmin(msg.caller)) {
      return false;
    };

    let config : AdminConfig = {
      principal = userPrincipal;
      role = role;
      assignedBy = msg.caller;
      assignedAt = Time.now();
      isActive = true;
    };

    let _ = HashMap.put(userRoles, phash, userPrincipal, config);
    true;
  };

  // Revoke user role (admin only)
  public shared (msg) func revokeUserRole(userPrincipal: Principal) : async Bool {
    if (not isAdmin(msg.caller)) {
      return false;
    };

    switch (HashMap.get(userRoles, phash, userPrincipal)) {
      case null false;
      case (?config) {
        let updatedConfig = { config with isActive = false };
        let _ = HashMap.put(userRoles, phash, userPrincipal, updatedConfig);
        true;
      };
    };
  };

  // Get user role
  public query func getUserRole(userPrincipal: Principal) : async ?UserRole {
    switch (HashMap.get(superAdmins, phash, userPrincipal)) {
      case (?true) ?#admin;
      case _ {
        switch (HashMap.get(userRoles, phash, userPrincipal)) {
          case (?(config)) if (config.isActive) ?config.role else null;
          case null null;
        };
      };
    };
  };

  // Get current user's role
  public shared (msg) func getMyRole() : async ?UserRole {
    await getUserRole(msg.caller);
  };

  // List all users with roles (admin only)
  public shared (msg) func listUsersWithRoles() : async [AdminConfig] {
    if (not isAdmin(msg.caller)) {
      return [];
    };

    let configs = HashMap.vals(userRoles);
    let superAdminConfigs = Iter.map(HashMap.keys(superAdmins), func(principal: Principal): AdminConfig {
      {
        principal = principal;
        role = #admin;
        assignedBy = principal; // Self-assigned
        assignedAt = 0; // Unknown time
        isActive = true;
      };
    });

    Array.append(
      Iter.toArray(configs),
      Iter.toArray(superAdminConfigs)
    );
  };

  // Check if current user is admin
  public shared (msg) func isCurrentUserAdmin() : async Bool {
    isAdmin(msg.caller);
  };

  // Check if current user is verifier
  public shared (msg) func isCurrentUserVerifier() : async Bool {
    isVerifier(msg.caller);
  };

  // Check if current user is reviewer
  public shared (msg) func isCurrentUserReviewer() : async Bool {
    isReviewer(msg.caller);
  };

  // Get current user's principal ID (for debugging/verification)
  public shared (msg) func getCurrentUserPrincipal() : async Text {
    Principal.toText(msg.caller);
  };

  // Get file chunks for verification (verifiers/admins only)
  public shared (msg) func getFileChunkForVerification(submitterPrincipal: Principal, credentialName: Text, chunkIndex: Nat) : async ?Blob {
    // Check if user is a verifier, reviewer, or admin
    let userIsVerifier = isVerifier(msg.caller);
    let userIsReviewer = isReviewer(msg.caller);
    let userIsAdmin = isAdmin(msg.caller);
    let hasPermission = userIsVerifier or userIsReviewer or userIsAdmin;
    
    if (not hasPermission) {
      return null;
    };

    // Get the submitter's files
    switch (HashMap.get(files, phash, submitterPrincipal)) {
      case null null;
      case (?submitterFiles) {
        switch (HashMap.get(submitterFiles, thash, credentialName)) {
          case null null;
          case (?file) {
            switch (Array.find(file.chunks, func(chunk : FileChunk) : Bool { chunk.index == chunkIndex })) {
              case null null;
              case (?foundChunk) ?foundChunk.chunk;
            };
          };
        };
      };
    };
  };

  // Get file metadata for verification (verifiers/admins only)
  public shared (msg) func getFileMetadataForVerification(submitterPrincipal: Principal, credentialName: Text) : async ?{ name: Text; size: Nat; fileType: Text; totalChunks: Nat; ecdsa_sign: Text; schnorr_sign: Text; } {
    // Check if user is a verifier, reviewer, or admin
    let userIsVerifier = isVerifier(msg.caller);
    let userIsReviewer = isReviewer(msg.caller);
    let userIsAdmin = isAdmin(msg.caller);
    let hasPermission = userIsVerifier or userIsReviewer or userIsAdmin;
    
    if (not hasPermission) {
      return null;
    };

    // Get the submitter's files
    switch (HashMap.get(files, phash, submitterPrincipal)) {
      case null null;
      case (?submitterFiles) {
        switch (HashMap.get(submitterFiles, thash, credentialName)) {
          case null null;
          case (?file) {
            ?{
              name = file.name;
              size = file.totalSize;
              fileType = file.fileType;
              totalChunks = file.chunks.size();
              ecdsa_sign = file.ecdsa_sign;
              schnorr_sign = file.schnorr_sign;
            };
          };
        };
      };
    };
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
