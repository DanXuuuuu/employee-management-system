import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import {  fetchVisaInProgress,  fetchAllVisa,   approveVisaDoc,  rejectVisaDoc,  sendVisaReminder,
  clearSuccessMessage } from '../../store/hrSlice';

export default function VisaManagement() {
  //  Redux Setup  
  const dispatch = useDispatch();
  
  // get data from Redux store 
  const { visaInProgress, allVisa, loading, error, successMessage } = useSelector(
    (state) => state.hr
  );

  // Local State 

  const [activeTab, setActiveTab] = useState('in-progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  //  Effects  
  // fetch two lists of data  when page loading 
  useEffect(() => {
    dispatch(fetchVisaInProgress());
    dispatch(fetchAllVisa());
  }, [dispatch]);

  // show success  
  useEffect(() => {
    if (successMessage) {
     
      alert(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  //  Event Handlers  
  // approve doc  
  const handleApproveDoc = async (employeeId, docType) => {
     if (isProcessing) return; //avoid click again 
     setIsProcessing(true);
    // dispatch return Promise & could await
    const result = await dispatch(approveVisaDoc({ userId: employeeId, docType }));
    
    // success re - fetch 
    if (result.type.endsWith('fulfilled')) {
    // delay refresh
    setTimeout(() => {
      dispatch(fetchVisaInProgress());
      dispatch(fetchAllVisa());
      setIsProcessing(false);
        }, 500);
    } else {
        setIsProcessing(false);
    }
  };

  //reject doc 
  const handleRejectDoc = async (employeeId, docType) => {
    if (isProcessing) return; 

    const feedback = prompt('Please enter rejection reason');
    if (!feedback) return;
    setIsProcessing(true);
    
    const result = await dispatch(rejectVisaDoc({ userId: employeeId, docType, feedback }));
    
    if (result.type.endsWith('fulfilled')) {
        setTimeout(() => {
        dispatch(fetchVisaInProgress());
        dispatch(fetchAllVisa());
        setIsProcessing(false);
        }, 500);
    } else {
        setIsProcessing(false);
    }
  };

  // send reminder email 
  const handleSendReminder = async (employeeId, email) => {
    if (isProcessing) return;
    setIsProcessing(true);
    await dispatch(sendVisaReminder({ userId: employeeId, email }));
    setIsProcessing(false);
  };

  // Helper Functions  
  // frontend filter  
  const filterBySearch = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) =>
      `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase().includes(q)
    );
  };

  const filteredInProgress = filterBySearch(visaInProgress);
  const filteredAllVisa = filterBySearch(allVisa);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Visa Status Management
      </h1>

      {/* error message  */}
      {error.visa && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.visa}
        </div>
      )}

      {/* search box */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Tab change */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('in-progress')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            activeTab === 'in-progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          In Progress ({filteredInProgress.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          All Employees ({filteredAllVisa.length})
        </button>
      </div>

      {/* In Progress Tab */}
      {activeTab === 'in-progress' && (
        <div className="bg-white rounded-lg shadow p-6">
          {loading.visa ? (
            <div className="text-center py-8 text-gray-500">
              Loading visa data...
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Work Authorization</th>
                  <th className="px-4 py-2">Next Step</th>
                  <th className="px-4 py-2">Days Remaining</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInProgress.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center text-gray-400">
                      No employees in progress
                    </td>
                  </tr>
                ) : (
                  filteredInProgress.map((item) => (
                    <tr key={item.employee._id} className="border-t">
                      <td className="px-4 py-2">
                        {item.employee.firstName} {item.employee.lastName}
                      </td>
                      <td className="px-4 py-2">
                        {item.employee.residencyStatus?.workAuthorization?.type || 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                          {item.nextStep}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`font-medium ${
                          item.daysRemaining !== null && item.daysRemaining < 30
                            ? 'text-red-600'
                            : 'text-gray-700'
                        }`}>
                          {item.daysRemaining !== null ? `${item.daysRemaining} days` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          {item.nextStep.startsWith('Review') && (
                            <>
                              <button
                                onClick={() => handleApproveDoc(
                                  item.employee.user._id,
                                  item.currentDoc.type
                                )}
                                disabled={isProcessing} 
                               className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                 {isProcessing ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectDoc(
                                  item.employee.user._id,
                                  item.currentDoc.type
                                )}
                                 disabled={isProcessing}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                 {isProcessing ? 'Processing...' : 'Reject'}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleSendReminder(
                              item.employee.user._id,
                              item.employee.user.email
                            )}
                             disabled={isProcessing}
                           className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                            {isProcessing ? 'Sending...' : 'Remind'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* All Employees Tab */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-lg shadow p-6">
          {loading.visa ? (
            <div className="text-center py-8 text-gray-500">
              Loading visa data...
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">OPT Receipt</th>
                  <th className="px-4 py-2">OPT EAD</th>
                  <th className="px-4 py-2">I-983</th>
                  <th className="px-4 py-2">I-20</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllVisa.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center text-gray-400">
                      No visa employees found
                    </td>
                  </tr>
                ) : (
                  filteredAllVisa.map((item) => (
                    <tr key={item.employee._id} className="border-t">
                      <td className="px-4 py-2">
                        {item.employee.firstName} {item.employee.lastName}
                      </td>
                      {['OPT Receipt', 'OPT EAD', 'I-983', 'I-20'].map((docType) => (
                        <td key={docType} className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.documents[docType]?.status === 'Approved'
                              ? 'bg-green-100 text-green-700'
                              : item.documents[docType]?.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : item.documents[docType]?.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {item.documents[docType]?.status || 'N/A'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}