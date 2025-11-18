import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import { useVendors } from "../../context/VendorsContext";

export default function VendorForm() {
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const { vendors, addVendor } = useVendors();
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactPerson: "",
    contactNumber: "",
    category: "",
    address: "",
    remarks: "",
    status: "",
    documents: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "documents") {
      if (files && files.length > 0) {
        setForm(f => {
          // Merge new files with previous, avoiding duplicates
          const prevFiles = f.documents;
          const newFiles = Array.from(files).filter(
            file => !prevFiles.some(existing => existing.name === file.name && existing.size === file.size)
          );
          return {
            ...f,
            documents: [...prevFiles, ...newFiles],
          };
        });
        // Reset file input so user can select same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = null;
      }
    } else {
      setForm(f => ({
        ...f,
        [name]: value,
      }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Vendor Name and Vendor Email are required.");
      return;
    }
    setError("");
    // generate next numeric ID based on existing vendors (preserves V### pattern)
    const maxNum = vendors.reduce((m,v)=>{
      const n = parseInt(v.id.replace(/[^0-9]/g,''),10); return isNaN(n)? m : Math.max(m,n);
    },0);
    const newId = 'V' + String(maxNum + 1).padStart(3,'0');
    const newVendor = {
      id: newId,
      name: form.name.trim(),
      address: form.address.trim(),
      contact: form.contactNumber.trim(),
      status: form.status || 'Active',
      email: form.email.trim(),
      contactPerson: form.contactPerson.trim(),
      contactNumber: form.contactNumber.trim(),
      category: form.category.trim(),
      remarks: form.remarks.trim()
    };
    addVendor(newVendor);
    setSubmitted(true);
    // navigate to detail page for new vendor
    navigate(`/vendors/${newId}`);
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Vendor Details Form</h2>
      <form className={styles.vendorForm} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Vendor Name *</label>
            <input className={styles.formInput} name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Vendor Email *</label>
            <input className={styles.formInput} name="email" value={form.email} onChange={handleChange} required type="email" />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Contact Person (optional)</label>
            <input className={styles.formInput} name="contactPerson" value={form.contactPerson} onChange={handleChange} />
          </div>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Contact Number (optional)</label>
            <input className={styles.formInput} name="contactNumber" value={form.contactNumber} onChange={handleChange} />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Vendor Category (optional)</label>
            <input className={styles.formInput} name="category" value={form.category} onChange={handleChange} />
          </div>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Address (optional)</label>
            <input className={styles.formInput} name="address" value={form.address} onChange={handleChange} />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Remarks</label>
            <input className={styles.formInput} name="remarks" value={form.remarks} onChange={handleChange} />
          </div>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Status (optional)</label>
            <select className={styles.formInput} name="status" value={form.status} onChange={handleChange}>
              <option value="">Select Status</option>
              <option value="REQUESTED">Requested</option>
              <option value="AWAITING_RESPONSE">Awaiting Response</option>
              <option value="MISSING_DATA">Missing Data</option>
              <option value="AWAITING_VALIDATION">Awaiting Validation</option>
              <option value="VALIDATED">Validated</option>
              <option value="DENIED">Denied</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Attach Documents</label>
            <input
              className={styles.formInput}
              name="documents"
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleChange}
            />
            {form.documents.length > 0 && (
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                {form.documents.map((file, idx) => (
                  <li key={idx} style={{ fontSize: "0.95rem", color: "#4a5568" }}>
                    {file.name}
                    <button
                      type="button"
                      style={{ marginLeft: 8, color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                      onClick={() => setForm(f => ({
                        ...f,
                        documents: f.documents.filter((_, i) => i !== idx)
                      }))}
                    >Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {error && <div style={{color:'#e53e3e', fontSize:'0.9rem'}}>{error}</div>}
        <button className={styles.formBtn} type="submit">Submit</button>
      </form>
      {submitted && (
        <div className={styles.formSubmitted}>
          <strong>Submitted Data:</strong>
          <pre>{JSON.stringify(form, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
