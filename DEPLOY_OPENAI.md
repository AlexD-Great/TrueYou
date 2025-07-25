```bash
dfx identity new <your-identity-name>  # only if not yet created
dfx identity use <your-identity-name>
```

---

### 🚀 **1. Build and Deploy to Mainnet**

#### 🔹 a. Set Mainnet as Target

```bash
dfx build --network ic
dfx deploy --network ic
```

> This will deploy all canisters defined in `dfx.json` to the mainnet.

---

### 📁 **4. Hosting Frontend (Optional)**

If you have a frontend canister:

```bash
dfx deploy frontend --network ic
```

---

### 🔍 **5. Verify Deployment**

Run:

```bash
dfx canister --network ic status <canister-name>
```
---