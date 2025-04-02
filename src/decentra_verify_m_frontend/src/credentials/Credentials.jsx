import Card from "../components/Cards";
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import "../index.css";
import "./credentials.css";

function Credentials() {
  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState();
  const [fileTransferProgress, setFileTransferProgress] = useState();
  const { isAuthenticated, actor } = useAuth();

  useEffect(() => {
    // updateActor();
    setErrorMessage();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [isAuthenticated]);

  async function loadFiles() {
    try {
      const fileList = await actor.getFiles();
      console.log(fileList);
      setFiles(fileList);
    } catch (error) {
      console.error("Failed to load files:", error);
      setErrorMessage("Failed to load files. Please try again.");
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    setErrorMessage();

    if (!file) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    if (await actor.checkFileExists(file.name)) {
      setErrorMessage(
        `File "${file.name}" already exists. Please choose a different file name.`
      );
      return;
    }
    setFileTransferProgress({
      mode: "Uploading and Signing",
      fileName: file.name,
      progress: 0,
    });

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = new Uint8Array(e.target.result);
      const chunkSize = 1024 * 1024; // 1 MB chunks
      const totalChunks = Math.ceil(content.length / chunkSize);

      try {
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, content.length);
          const chunk = content.slice(start, end);

          await actor.uploadFileChunk(file.name, chunk, BigInt(i), file.type);
          setFileTransferProgress((prev) => ({
            ...prev,
            progress: Math.floor(((i + 1) / totalChunks) * 100),
          }));
        }
      } catch (error) {
        console.error("Upload failed:", error);
        setErrorMessage(`Failed to upload ${file.name}: ${error.message}`);
      } finally {
        await loadFiles();
        setFileTransferProgress(null);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async function handleFileDownload(name) {
    setFileTransferProgress({
      mode: "Downloading",
      fileName: name,
      progress: 0,
    });
    try {
      const totalChunks = Number(await actor.getTotalChunks(name));
      const fileType = await actor.getFileType(name)[0];
      let chunks = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunkBlob = await actor.getFileChunk(name, BigInt(i));
        if (chunkBlob) {
          chunks.push(chunkBlob[0]);
        } else {
          throw new Error(`Failed to retrieve chunk ${i}`);
        }

        setFileTransferProgress((prev) => ({
          ...prev,
          progress: Math.floor(((i + 1) / totalChunks) * 100),
        }));
      }

      const data = new Blob(chunks, { type: fileType });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      setErrorMessage(`Failed to download ${name}: ${error.message}`);
    } finally {
      setFileTransferProgress(null);
    }
  }

  async function handleFileDelete(name) {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const success = await actor.deleteFile(name);
        if (success) {
          await loadFiles();
        } else {
          setErrorMessage("Failed to delete file");
        }
      } catch (error) {
        console.error("Delete failed:", error);
        setErrorMessage(`Failed to delete ${name}: ${error.message}`);
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="credential-header flex flex-row justify-between">
        <h1 className="mb-4 text-2xl font-bold">
          Credentials Upload And Signing
        </h1>
      </div>

      {!isAuthenticated ? (
        <div className="mt-4 rounded-md border-l-4 bg-neutral-200 p-4 shadow-md">
          <p className="mt-2 text-black">
            Please sign in to access the file vault.
          </p>
        </div>
      ) : (
        <div className="credential-items">
          <div className="mb-4">
            <input
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-md border border-red-400 bg-red-100 p-3 text-red-700">
              {errorMessage}
            </div>
          )}

          {fileTransferProgress && (
            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-600">
                {`${fileTransferProgress.mode} ${fileTransferProgress.fileName} ... ${fileTransferProgress.progress}%`}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {files.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                You have no files. Upload some!
              </p>
            ) : (
              files.map((file, index) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between rounded-lg bg-white p-3 shadow"
                >
                  <Card
                    key={index}
                    name={file.name}
                    ecdsa_sign={file.ecdsa_sign}
                    schnorr_sign={file.schnorr_sign}
                    onDownload={handleFileDownload}
                    onDelete={handleFileDelete}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Credentials;
