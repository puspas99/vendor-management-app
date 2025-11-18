import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import styles from './Dashboard.module.css'
import Sidebar from './Sidebar'
import Header from '../../components/Header'
import procurementService from '../../services/procurementService'

export default function VendorsList(){
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // State for API data
  const [vendors, setVendors] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  // initialize from URL params
  const initialFilterParam = searchParams.get('filter') || ''
  const initialFilterField = searchParams.get('filterField') || (initialFilterParam ? 'status' : '')
  const initialFilterText = searchParams.get('filterText') || initialFilterParam || ''
  const initialEnable = searchParams.get('enableFilter') === 'true' || !!searchParams.get('filterField') || !!initialFilterParam
  const initialSortField = searchParams.get('sortField') || 'vendorName'
  const initialSortOrder = searchParams.get('sortOrder') || 'asc'
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const initialPageSize = parseInt(searchParams.get('pageSize') || '6', 10)

  const [enableFilter, setEnableFilter] = React.useState(initialEnable)
  const [filterField, setFilterField] = React.useState(initialFilterField)
  const [filterText, setFilterText] = React.useState(initialFilterText)

  const [sortField, setSortField] = React.useState(initialSortField)
  const [sortOrder, setSortOrder] = React.useState(initialSortOrder)
  const [page, setPage] = React.useState(isNaN(initialPage) ? 1 : initialPage)
  const [pageSize, setPageSize] = React.useState(isNaN(initialPageSize) ? 6 : initialPageSize)

  // Fetch vendors from API
  React.useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const statusFilter = initialFilterParam || null
        const response = await procurementService.getAllVendors(statusFilter)
        
        if (response.success && response.data) {
          setVendors(response.data)
        } else {
          setError(response.message || 'Failed to fetch vendors')
        }
      } catch (err) {
        console.error('Error fetching vendors:', err)
        setError(err.message || 'An error occurred while fetching vendors')
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [initialFilterParam])

  // Export handlers
  const handleExportPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'export-pdf' })
      
      const statusFilter = initialFilterParam || null
      await procurementService.exportVendorsToPDF(statusFilter)
      
      toast.success('PDF exported successfully!', { id: 'export-pdf' })
    } catch (err) {
      console.error('Error exporting PDF:', err)
      toast.error('Failed to export PDF', { id: 'export-pdf' })
    }
  }

  const handleExportDetailedPDF = async () => {
    try {
      toast.loading('Generating detailed report...', { id: 'export-detailed' })
      
      const statusFilter = initialFilterParam || null
      await procurementService.exportDetailedVendorReport(statusFilter)
      
      toast.success('Detailed report exported successfully!', { id: 'export-detailed' })
    } catch (err) {
      console.error('Error exporting detailed report:', err)
      toast.error('Failed to export detailed report', { id: 'export-detailed' })
    }
  }

  // update URL whenever relevant state changes
  React.useEffect(()=>{
    const params = {}
    if(enableFilter){
      if(filterField) params.filterField = filterField
      if(filterText) params.filterText = filterText
    } else if(filterField === 'status' && filterText){
      // keep backward-compatible single `filter` param when user clicked stat
      params.filter = filterText
    }
    // Always include explicit enableFilter flag so navigation from Dashboard
    // (e.g. `?enableFilter=false`) is preserved and the page initializes correctly.
    params.enableFilter = enableFilter ? 'true' : 'false'
    params.sortField = sortField
    params.sortOrder = sortOrder
    params.page = String(page)
    params.pageSize = String(pageSize)
    setSearchParams(params, { replace: true })
  }, [enableFilter, filterField, filterText, sortField, sortOrder, page, pageSize, setSearchParams])

  // compute filtered list
  const filtered = React.useMemo(()=>{
    let list = vendors.slice()
    if(enableFilter && filterField && filterText.trim() !== ''){
      const q = filterText.trim().toLowerCase()
      if(filterField === 'vendorid') list = list.filter(v => String(v.id).toLowerCase().includes(q))
      else if(filterField === 'vendorname') list = list.filter(v => v.vendorName?.toLowerCase().includes(q))
      else if(filterField === 'status') list = list.filter(v => v.status?.toLowerCase().includes(q))
    } else if(!enableFilter && initialFilterParam){
      // initial status filter from /vendors?filter=Active
      list = list.filter(v => v.status?.toLowerCase() === initialFilterParam.toLowerCase())
    }
    return list
  }, [vendors, enableFilter, filterField, filterText, initialFilterParam])

  // apply sort
  const sorted = React.useMemo(()=>{
    const s = filtered.slice()
    s.sort((a,b)=>{
      let A = a[sortField] || ''
      let B = b[sortField] || ''
      // normalize for name/id/status
      A = String(A).toLowerCase(); B = String(B).toLowerCase();
      if(A < B) return sortOrder === 'asc' ? -1 : 1
      if(A > B) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return s
  }, [filtered, sortField, sortOrder])

  // pagination
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  React.useEffect(()=>{ if(page > totalPages) setPage(1) }, [page, totalPages])
  const start = (page-1)*pageSize
  const paged = sorted.slice(start, start+pageSize)

  if (loading) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>Vendors</h1>
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
            Loading vendors...
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>Vendors</h1>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '16px', color: '#dc2626', marginBottom: '16px' }}>{error}</p>
            <button className={styles.newBtn} onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main className={styles.mainContent}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <h1 className={styles.title}>Vendors</h1>
              <p className={styles.subtitle}>Showing: {enableFilter && filterField && filterText ? `${filterField} matches "${filterText}"` : (initialFilterParam ? `${initialFilterParam} vendors` : 'All vendors')}</p>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button 
              className={styles.newBtn}
              style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: 600}}
              onClick={() => navigate('/add-vendor')}
              title="Invite a new vendor"
            >
              + Invite Vendor
            </button>
            <button 
              className={styles.exportBtn} 
              onClick={handleExportPDF}
              title="Export vendors to PDF"
            >
              📄 Export PDF
            </button>
            <button 
              className={styles.exportBtn} 
              onClick={handleExportDetailedPDF}
              title="Export detailed report with statistics"
            >
              📊 Detailed Report
            </button>
            <button className={styles.newBtn} onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>

        {/* Filter controls + sort */}
        <div className={styles.filterBar}>
          <label style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="checkbox" checked={enableFilter} onChange={e=>{ setEnableFilter(e.target.checked); if(!e.target.checked){ setFilterField(''); setFilterText('') } }} />
            <span>Enable filter</span>
          </label>

          <div className={styles.filterControls}>
            <select className={styles.filterSelect} disabled={!enableFilter} value={filterField} onChange={e=>setFilterField(e.target.value)}>
              <option value="">Select field</option>
              <option value="vendorid">Vendor ID</option>
              <option value="vendorname">Vendor Name</option>
              <option value="status">Status</option>
            </select>

            <input
              className={styles.filterInput}
              type="text"
              placeholder={filterField ? `Enter ${filterField}` : 'Select a field first'}
              disabled={!enableFilter || !filterField}
              value={filterText}
              onChange={e=>setFilterText(e.target.value)}
            />

            <button className={styles.clearBtn} onClick={() => { setEnableFilter(false); setFilterField(''); setFilterText('') }}>Clear</button>
          </div>

          <div className={styles.sortControls}>
            <label style={{fontSize:13, color:'#444'}}>Sort:</label>
            <select value={sortField} onChange={e=>setSortField(e.target.value)} className={styles.filterSelect}>
              <option value="vendorName">Name</option>
              <option value="id">ID</option>
              <option value="status">Status</option>
            </select>
            <button className={styles.clearBtn} onClick={()=>setSortOrder(o=> o==='asc' ? 'desc' : 'asc')}>{sortOrder === 'asc' ? '↑' : '↓'}</button>
          </div>
        </div>

        <div style={{marginTop:12,fontSize:13,color:'#666'}}>Results: {total}</div>

        <div className={styles.vendorsGrid}>
          {paged.map(v => (
            <div
              key={v.id}
              className={styles.vendorCard}
              onClick={() => navigate(`/vendors/${v.id}`)}
              style={{ cursor: 'pointer', transition: 'transform 160ms ease, box-shadow 160ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(2,6,23,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(2,6,23,0.06)'; }}
            >
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <strong>{v.vendorName || 'N/A'}</strong>
                <span className={styles.vendorStatus}>{v.status || 'Pending'}</span>
              </div>
              <div style={{marginTop:8}}>
                <div>ID: {v.id}</div>
                <div>Email: {v.vendorEmail || 'N/A'}</div>
                <div>Contact: {v.contactNumber || 'N/A'}</div>
                <div>Category: {v.vendorCategory || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>

        {paged.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
            No vendors found
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>Page {page} of {totalPages}</div>
            <div>
              <button className={styles.pageBtn} onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</button>
              <button className={styles.pageBtn} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>Next</button>
              <select value={pageSize} onChange={e=>setPageSize(parseInt(e.target.value,10))} className={styles.filterSelect} style={{marginLeft:12}}>
                <option value={4}>4</option>
                <option value={6}>6</option>
                <option value={8}>8</option>
              </select>
            </div>
          </div>
        )}

        </main>
      </div>
    </div>
  )
}
