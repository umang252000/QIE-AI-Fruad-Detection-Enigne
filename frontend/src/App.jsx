import React, { useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./config";
import Dashboard from "./Dashboard";

export default function App() {
  const [wallet, setWallet] = useState("");
  const [result, setResult] = useState(null);

  const [connectedWallet, setConnectedWallet] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [fraudScore, setFraudScore] = useState("");
  const [txHash, setTxHash] = useState("");
  const [lastCID, setLastCID] = useState("");

  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingIPFS, setLoadingIPFS] = useState(false);

  // Create provider once
  const getProvider = () => new ethers.providers.Web3Provider(window.ethereum);

  /* -------------------------------------------------------------------------- */
  /*                               CONNECT WALLET                               */
  /* -------------------------------------------------------------------------- */
  async function connectWallet() {
    try {
      if (!window.ethereum) {
        return alert("Install MetaMask or QIE Wallet!");
      }

      const provider = getProvider();
      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setConnectedWallet(address);
      alert("Wallet connected: " + address);
    } catch (error) {
      console.error(error);
      alert("Wallet connection failed");
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                             GET FRAUD AI SCORE                             */
  /* -------------------------------------------------------------------------- */
  async function checkScore() {
    try {
      if (!wallet) return alert("Enter a wallet address");

      setResult(null);
      setLoadingReport(true);

      const res = await axios.post("http://localhost:8000/score", { wallet });
      setResult(res.data);
    } catch (err) {
      alert("Error fetching score");
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               UPLOAD TO IPFS                               */
  /* -------------------------------------------------------------------------- */
  async function uploadToIPFS() {
    try {
      setLoadingIPFS(true);

      const fileBlob = new Blob([evidenceText], { type: "text/plain" });
      const formData = new FormData();
      formData.append("file", fileBlob, "evidence.txt");

      const res = await fetch("http://127.0.0.1:5001/api/v0/add?pin=true", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();

      const match = text.match(/\"Hash\":\"(.*?)\"/);
      if (!match) throw new Error("CID not found in IPFS response");

      const cid = match[1];
      setLastCID(cid);
      return cid;
    } catch (err) {
      console.error("IPFS error:", err);
      alert("IPFS upload failed");
      return null;
    } finally {
      setLoadingIPFS(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                           SUBMIT TO SMART CONTRACT                         */
  /* -------------------------------------------------------------------------- */
  async function submitReport() {
    try {
      if (!connectedWallet) return alert("Connect wallet first!");
      if (!wallet) return alert("Enter wallet to report");
      if (!evidenceText.trim()) return alert("Enter evidence text");
      if (!fraudScore) return alert("Enter fraud score (0–100)");

      // Upload evidence to IPFS
      const cid = await uploadToIPFS();
      if (!cid) return;

      const evidenceHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(cid)
      );

      const provider = getProvider();
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const tx = await contract.reportSuspicious(
        wallet,
        evidenceHash,
        Number(fraudScore)
      );

      setTxHash(tx.hash);
      await tx.wait();

      alert("Report submitted on-chain!");
    } catch (err) {
      console.error(err);
      alert("Transaction failed");
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                    UI                                      */
  /* -------------------------------------------------------------------------- */

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* LEFT SIDEBAR */}
      <div style={{ width: 260, background: "#f0f0f0", padding: 20 }}>
        <h2>Menu</h2>

        {/* Connect Wallet */}
        <button onClick={connectWallet} style={{ padding: 10, marginTop: 10 }}>
          Connect Wallet
        </button>

        {connectedWallet && (
          <p style={{ wordWrap: "break-word", marginTop: 10 }}>
            Connected: <b>{connectedWallet}</b>
          </p>
        )}

        {/* Search Wallet */}
        <h3 style={{ marginTop: 30 }}>Search Wallet</h3>
        <input
          placeholder="Enter wallet"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />

        <button
          onClick={checkScore}
          style={{ padding: 10, marginTop: 10, width: "100%" }}
          disabled={loadingReport}
        >
          {loadingReport ? "Checking..." : "Check Score"}
        </button>

        {result && (
          <div style={{ marginTop: 20 }}>
            <h4>Risk Score: {result.risk_score}</h4>
            <pre>{JSON.stringify(result.features, null, 2)}</pre>
          </div>
        )}

        {/* Submit Fraud Report */}
        <h3 style={{ marginTop: 30 }}>Report Fraud</h3>

        <textarea
          placeholder="Write evidence here"
          value={evidenceText}
          onChange={(e) => setEvidenceText(e.target.value)}
          style={{ width: "100%", height: 100 }}
        />

        <input
          type="number"
          placeholder="Score (0–100)"
          value={fraudScore}
          onChange={(e) => setFraudScore(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 10 }}
        />

        <button
          onClick={submitReport}
          style={{
            padding: 10,
            marginTop: 10,
            width: "100%",
            background: "red",
            color: "white",
          }}
          disabled={loadingIPFS}
        >
          {loadingIPFS ? "Uploading..." : "Submit Report"}
        </button>

        {txHash && (
          <div style={{ marginTop: 20 }}>
            <p>TX: {txHash}</p>
            <p>CID: {lastCID}</p>
            <a
              href={`https://ipfs.io/ipfs/${lastCID}`}
              target="_blank"
              style={{ color: "blue" }}
            >
              View Evidence
            </a>
          </div>
        )}
      </div>

      {/* RIGHT DASHBOARD */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <Dashboard onWalletSelect={(w) => setWallet(w)} />
      </div>
    </div>
  );
}