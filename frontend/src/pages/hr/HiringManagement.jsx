import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchTokenHistory, fetchOnboardingApplications, approveApplication, rejectApplication, generateToken,
  clearSuccessMessage} from '../../store/hrSlice';

export default function HiringManagement() {
  const dispatch = useDispatch();
  
  // fetch data from redux store
  const {   tokenHistory,  onboardingApplications, loading, error, successMessage } = useSelector((state) => state.hr);

  //  Local state  

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);

  //   effects  
  // fetch data when loading page
  useEffect(() => {
    dispatch(fetchTokenHistory());
    dispatch(fetchOnboardingApplications());
  }, [dispatch]);

  // dealwith success message 
  useEffect(() => {
    if (successMessage) {
      setMessage(successMessage);
      // clean message after 3s
      const timer = setTimeout(() => {
        setMessage('');
        dispatch(clearSuccessMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Event Handlers  
  // Generate Token
  const handleGenerateToken = async () => {
    // must email and name 
    if (!email || !name) {
      setMessage('Please enter both email and name');
      return;
    }

    // clean old message
    setMessage('');

    // dispatch return Promise and check result 
    const result = await dispatch(generateToken({ email }));
    
    // success - clean form
    if (result.type.endsWith('fulfilled')) {
      setEmail('');
      setName('');
    } else {
      setMessage(result.payload || 'Failed to send invitation');
    }
  };

  // approve 
  const handleApprove = async (id) => {
    const result = await dispatch(approveApplication(id));
    
    if (result.type.endsWith('fulfilled')) {
      // re fetch list 
      dispatch(fetchOnboardingApplications());
    }
  };

  // reject 
  const handleReject = async (id) => {
    const feedback = prompt('Please enter rejection reason:');
    if (!feedback) return;

    const result = await dispatch(rejectApplication({ id, feedback }));
    
    if (result.type.endsWith('fulfilled')) {
      dispatch(fetchOnboardingApplications());
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Hiring Management
      </h1>

      {/* show error message  */}
      {error.hiring && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.hiring}
        </div>
      )}

      {/* Token generate  */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Generate Registration Token
        </h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Employee name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleGenerateToken}
            disabled={loading.hiring}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading.hiring ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
        {message && (
          <p className="mt-3 text-sm text-green-600">{message}</p>
        )}
      </div>

      {/* Token history record  */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Registration Token History
        </h2>

        {loading.hiring ? (
          <div className="text-center py-8 text-gray-500">
            Loading token history...
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {tokenHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-center text-gray-400">
                    No records found
                  </td>
                </tr>
              ) : (
                tokenHistory.map((token) => (
                  <tr key={token._id} className="border-t">
                    <td className="px-4 py-2">{token.email}</td>
                    <td className="px-4 py-2">{token.name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        token.status === 'used'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {token.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Onboarding application review  */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Onboarding Applications Review
        </h2>

        {loading.hiring ? (
          <div className="text-center py-8 text-gray-500">
            Loading applications...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* Pending list  */}
            <div>
              <h3 className="font-medium text-yellow-600 mb-2">
                Pending ({onboardingApplications.pending?.length || 0})
              </h3>
              {(!onboardingApplications.pending || onboardingApplications.pending.length === 0) ? (
                <p className="text-sm text-gray-400">No pending applications</p>
              ) : (
                onboardingApplications.pending.map((emp) => (
                  <div key={emp._id} className="border rounded p-3 mb-2">
                    <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-500">{emp.user?.email}</p>
                    <button
                      onClick={() => setSelectedApplication({ ...emp, _action: 'pending' })}
                      className="text-blue-600 hover:underline text-xs mt-1"
                    >
                      View Application
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Approved list  */}
            <div>
              <h3 className="font-medium text-green-600 mb-2">
                Approved ({onboardingApplications.approved?.length || 0})
              </h3>
              {(!onboardingApplications.approved || onboardingApplications.approved.length === 0) ? (
                <p className="text-sm text-gray-400">No approved applications</p>
              ) : (
                onboardingApplications.approved.map((emp) => (
                  <div key={emp._id} className="border rounded p-3 mb-2">
                    <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-500">{emp.user?.email}</p>
                    <button
                      onClick={() => setSelectedApplication({ ...emp, _action: 'approved' })}
                      className="text-blue-600 hover:underline text-xs mt-1"
                    >
                      View Application
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Rejected list  */}
            <div>
              <h3 className="font-medium text-red-600 mb-2">
                Rejected ({onboardingApplications.rejected?.length || 0})
              </h3>
              {(!onboardingApplications.rejected || onboardingApplications.rejected.length === 0) ? (
                <p className="text-sm text-gray-400">No rejected applications</p>
              ) : (
                onboardingApplications.rejected.map((emp) => (
                  <div key={emp._id} className="border rounded p-3 mb-2">
                    <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-500">{emp.user?.email}</p>
                    <p className="text-xs text-red-500 mt-1">
                      Feedback: {emp.hrFeedback}
                    </p>
                    <button
                      onClick={() => setSelectedApplication({ ...emp, _action: 'rejected' })}
                      className="text-blue-600 hover:underline text-xs mt-1"
                    >
                      View Application
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Application detail page */}
      {selectedApplication && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Application Detail
            </h2>
            <button
              onClick={() => setSelectedApplication(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-medium">
                {selectedApplication.firstName} {selectedApplication.middleName || ''} {selectedApplication.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Preferred Name</p>
              <p className="font-medium">{selectedApplication.preferredName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{selectedApplication.user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{selectedApplication.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-medium">
                {selectedApplication.dob ? new Date(selectedApplication.dob).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-medium">{selectedApplication.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">SSN</p>
              <p className="font-medium">
                {selectedApplication.ssn ? `***-**-${selectedApplication.ssn.slice(-4)}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Address</p>
              <p className="font-medium">
                {selectedApplication.address
                  ? `${selectedApplication.address.building || ''} ${selectedApplication.address.street || ''}, ${selectedApplication.address.city || ''}, ${selectedApplication.address.state || ''} ${selectedApplication.address.zip || ''}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Residency Status</p>
              <p className="font-medium">
                {selectedApplication.residencyStatus?.isCitizenOrPermanentResident
                  ? selectedApplication.residencyStatus.statusType
                  : selectedApplication.residencyStatus?.workAuthorization?.type || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Application Status</p>
              <p className="font-medium">{selectedApplication.applicationStatus}</p>
            </div>
          </div>

          {/* Emergency Contacts */}
          {selectedApplication.emergencyContacts?.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-500 text-sm mb-2">Emergency Contacts</p>
              {selectedApplication.emergencyContacts.map((contact, index) => (
                <div key={index} className="border rounded p-2 mb-1 text-sm">
                  <p className="font-medium">
                    {contact.firstName} {contact.lastName} ({contact.relationship})
                  </p>
                  <p className="text-gray-500">Phone: {contact.phone}</p>
                </div>
              ))}
            </div>
          )}

          {/* hr feedback when reject  */}
          {selectedApplication.hrFeedback && (
            <div className="mt-4 p-3 bg-red-50 rounded">
              <p className="text-sm text-red-600">
                HR Feedback: {selectedApplication.hrFeedback}
              </p>
            </div>
          )}

          {/* approve/reject button , only show pending situation */}
          {selectedApplication._action === 'pending' && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  handleApprove(selectedApplication._id);
                  setSelectedApplication(null);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  handleReject(selectedApplication._id);
                  setSelectedApplication(null);
                }}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}