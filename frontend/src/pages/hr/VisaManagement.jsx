import { useEffect, useState } from "react";
import api from '../../api';


export default function VisaManagement(){
    const [activeTab, setActiveTab] = useState('in-progress');
    const [inProgress, setInProgress] = useState([]);
    const [allVisa, setAllVisa] = useState([]);


    // fetch data when page loading 
    useEffect(()=>{
        fetchInProgress();
        fetchAllVisa();
    }, []);


    // fetch In progress visa employees
    const fetchInProgress = async()=>{
        try{

        }catch(err){
            console.error('Failed to fetch in-progress:', err);
        }
    };
    // fetch all visa employees
     const fetchAllVisa = async () => {
    try {
      const res = await api.get('/hr/visa/all');
      setAllVisa(res.data.data);
    } catch (err) {
      console.error('Failed to fetch all visa:', err);
    }
  };
//   handle the docs
    const handleApproveDoc = async (employeeId, docType) => {
        try {
        await api.patch(`/hr/visa/${employeeId}/${docType}/approve`);
        fetchInProgress();
        fetchAllVisa();
        } catch (err) {
        console.error('Failed to approve document:', err);
        }
    };

    const handleRejectDoc = async (employeeId, docType) => {
        const feedback = prompt('Please enter rejection reason');
        if (!feedback) return;

        try {
        await api.patch(`/hr/visa/${employeeId}/${docType}/reject`, { feedback });
        fetchInProgress();
        fetchAllVisa();
        } catch (err) {
        console.error('Failed to reject document:', err);
        }
    };
    // send reminder email 
    const handleSendReminder = async (employeeId, email) => {
        try {
            await api.post(`/hr/visa/${employeeId}/send-reminder`);
            alert(`Reminder email sent to ${email}`);
        } catch (err) {
            console.error('Failed to send reminder:', err);
        }
    };

return (
     <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Visa Status Management
      </h1>

      {/* change tab */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('in-progress')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            activeTab === 'in-progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          In Progress ({inProgress.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded text-sm font-medium ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          All Employees ({allVisa.length})
        </button>
      </div>

      {/* In Progress Tab  */}
      {activeTab === 'in-progress' && (
        <div className="bg-white rounded-lg shadow p-6">
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
              {inProgress.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-center text-gray-400">
                    No employees in progress
                  </td>
                </tr>
              ) : (
                inProgress.map((item) => (
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
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectDoc(
                                item.employee.user._id,
                                item.currentDoc.type
                              )}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleSendReminder(
                            item.employee.user._id,
                            item.employee.user.email
                          )}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          Remind
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/*  All Employees Tab  */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-lg shadow p-6">
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
              {allVisa.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-center text-gray-400">
                    No visa employees found
                  </td>
                </tr>
              ) : (
                allVisa.map((item) => (
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
        </div>
      )}
    </div>
  );
}
