import React, { useState, useRef } from 'react';
import styles from './Dashboard.module.css';
import { useVendors } from '../../context/VendorsContext';
import toast from 'react-hot-toast';

// Public vendor request form (no auth required)
export default function PublicVendorRequest(){
  const { addVendor } = useVendors();
  const fileInputRef = useRef(null);
  const [submittedId, setSubmittedId] = useState('');
  const [form, setForm] = useState({
    vendorName: '',
    vendorEmail: '',
    contactPerson: '',
    contactNumber: '',
    vendorCategory: '',
    address: '',
    remarks: '',
    files: []
  });

  function handleChange(e){
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleFiles(e){
    const files = Array.from(e.target.files || []);
    setForm(f => ({ ...f, files: [...f.files, ...files] }));
    if(fileInputRef.current) fileInputRef.current.value = null;
  }

  function reset(){
    setForm({ vendorName:'', vendorEmail:'', contactPerson:'', contactNumber:'', vendorCategory:'', address:'', remarks:'', files:[] });
    setSubmittedId('');
  }

  function handleSubmit(e){
    e.preventDefault();
    if(!form.vendorName || !form.vendorEmail || !form.contactPerson || !form.contactNumber){
      toast.error('Please fill all required * fields');
      return;
    }
    const newVendor = {
      id: 'V' + Math.random().toString(36).substring(2,10).toUpperCase(),
      name: form.vendorName,
      email: form.vendorEmail,
      contactPerson: form.contactPerson,
      contactNumber: form.contactNumber,
      category: form.vendorCategory,
      address: form.address || '-',
      remarks: form.remarks,
      status: 'Pending',
      contact: form.contactNumber,
      files: form.files
    };
    addVendor(newVendor);
    setSubmittedId(newVendor.id);
    toast.success('Vendor request submitted');
    // keep fields for user reference but disable form
  }

  const inputStyle = {
    width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', background:'#f9fafb'
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0a5f3f,#013d1f)', padding:'50px 20px', color:'#1f2937', fontFamily:'Inter, sans-serif' }}>
      <div style={{ maxWidth: '880px', margin:'0 auto', background:'#fff', padding:'34px 36px', borderRadius:'22px', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <img src="/Logo.png" alt="Logo" style={{ width:120, height:'auto', marginBottom:14 }} />
          <h1 style={{ margin:'0 0 10px', fontSize:32, color:'#0c6f3e' }}>New Vendor Request</h1>
          <p style={{ margin:0, fontSize:15, color:'#4b5563' }}>Please fill in all required details (*). Your submission will be reviewed.</p>
        </div>

        {submittedId && (
          <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', padding:'14px 18px', borderRadius:12, marginBottom:24 }}>
            <strong style={{ color:'#047857' }}>Submitted!</strong> Vendor ID: <code style={{ fontWeight:600 }}>{submittedId}</code>. You may close this page.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ opacity: submittedId ? 0.65 : 1, pointerEvents: submittedId ? 'none':'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
            <div>
              <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:6 }}>Vendor Name *</label>
              <input name="vendorName" value={form.vendorName} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:6 }}>Vendor Email *</label>
              <input name="vendorEmail" type="email" value={form.vendorEmail} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:6 }}>Contact Person *</label>
              <input name="contactPerson" value={form.contactPerson} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:6 }}>Contact Number *</label>
              <input name="contactNumber" value={form.contactNumber} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:6 }}>Vendor Category *</label>
              <select name="vendorCategory" value={form.vendorCategory} onChange={handleChange} style={inputStyle}>
                <option value="">-- Select Category --</option>
                <option value="IT Services">IT Services</option>
                <option value="Software Development">Software Development</option>
                <option value="Cloud Services">Cloud Services</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Electronics">Electronics</option>
                <option value="Logistics & Transportation">Logistics & Transportation</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Construction">Construction</option>
                <option value="Consulting Services">Consulting Services</option>
                <option value="Marketing & Advertising">Marketing & Advertising</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Packaging Materials">Packaging Materials</option>
                <option value="Cleaning Services">Cleaning Services</option>
                <option value="Security Services">Security Services</option>
                <option value="Facility Management">Facility Management</option>
                <option value="Legal Services">Legal Services</option>
                <option value="Accounting & Finance">Accounting & Finance</option>
                <option value="HR Services">HR Services</option>
                <option value="Training & Development">Training & Development</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:6 }}>Address</label>
              <input name="address" value={form.address} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:6 }}>Files</label>
              <input ref={fileInputRef} type="file" multiple onChange={handleFiles} style={inputStyle} />
              {form.files.length > 0 && (
                <ul style={{ marginTop:8, fontSize:12, color:'#374151', listStyle:'disc', paddingLeft:18 }}>
                  {form.files.map((f,i)=>(<li key={i}>{f.name}</li>))}
                </ul>
              )}
            </div>
          </div>

          <div style={{ marginTop:22 }}>
            <label style={{ fontWeight:600, fontSize:13, display:'block', marginBottom:6 }}>Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange} style={{ ...inputStyle, minHeight:110, resize:'vertical', fontFamily:'inherit' }} placeholder="Additional information" />
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:30 }}>
            <button type="button" onClick={reset} className={styles.newBtn} style={{ background:'#e5e7eb', color:'#374151' }}>Reset</button>
            <button type="submit" className={styles.newBtn} style={{ background:'#0a5f3f' }}>Submit Request</button>
          </div>
        </form>

        <div style={{ marginTop:34, textAlign:'center', fontSize:12, color:'#6b7280' }}>
          Powered by DevXcelerate Vendor Management
        </div>
      </div>
    </div>
  );
}
