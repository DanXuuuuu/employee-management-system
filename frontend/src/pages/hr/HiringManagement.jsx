import { useEffect, useState } from "react";
import api from '../../api';




export default function HiringManagement(){
    // state
    const [ email, setEmail ] = useState('');
    const [ name, setName ] = useState('');
    const [ sending, setSending ] = useState(false);
    const [ message, setMessage ] = useState('');
    const [ tokens, setTokens ] = useState([]);
    const [ applications, setApplications ] = useState({
        pending:[],
        approved: [],
        rejected:[]
    });

    const [selectedApplication, setSelectedApplication] = useState(null);

    // get data when page loading
    useEffect(()=>{
        fetchTokenHistory();
        fetchApplications();
    }, []);

    // fetch token history func
    const fetchTokenHistory = async()=>{
        try{
            const res = await api.get('/hr/token-history');
            // store data
            setTokens(res.data.data);

        }catch(err){
            console.error('Failed to fetch token history:', err);
        }
    };

    // fetch Onboarding applications 

    const fetchApplications = async() => {
        try{
            const res = await api.get('/hr/onboarding-applications');
            // data: res.data ,data: backendcode name
            setApplications(res.data.data);

        }catch(err){
            console.error('Failed to fetch onboarding application:', err);
        }
    };

    // send register invitation - call generate token api
    const handleGenerateToken = async()=>{
        try{
            // must have email and name
            if(!email || !name){
                setMessage('Please enter both email and name');
                return;

            };
        // change state
            setSending(true);
            // clean message 
            setMessage('');

            // generate token
            try{
                // request body
                const res = await api.post('/registration/generate', { email, name});
                // show the message on page 
                setMessage(res.data.message);
                // clean input box 
                setEmail('');
                setName('');
                // directly show, dont have to reload page when just sent invitation
                fetchTokenHistory();

            }catch(err){
                // undefined or message 
                setMessage(err.response?.data?.message || 'Failed to send invitation');
            }
            // finally must run whatever success or fail 
        }finally{
            // reset the sending button 
            setSending(false);
        }
    };
    // audit Onboarding application 
    //get id from page when clicked the button 
    const handleApprove = async (id)=>{
        try{
            // send update request and change the applicationStatus 
            await api.patch(`/hr/onboarding/${id}/approve`);
            fetchApplications();

        }catch(err){
            console.error('Failed to approve:', err);
        };


    }

    const handleReject = async(id)=>{
        const feedback = prompt('Please enter rejection reason:');
        if(!feedback) return;

        try{
            await api.patch(`/hr/onboarding/${id}/reject`, {feedback});
            fetchApplications();

        }catch(err){
            console.error('Failed to reject: ', err);
        }
    };
    return (
        <div className="p-6">
            {/* page  */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Hiring Management</h1>
            {/* token generator */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Generate Registration Token
                </h2>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Name
                        </label>
                        <input type="text" value={name} onChange={(e)=> setName(e.target.value)} placeholder="Employee name"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"/>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e)=> setEmail(e.target.value)} placeholder="employee@example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"/>
                    </div>
                    <button onClick={handleGenerateToken} disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400">
                    {sending ? 'Sending...' : 'Send Invitation'}
                    </button>  
                </div>
                {message && (
                    <p className="mt-3 text-sm text-green-600">{message}</p>
                )}
            </div>
            {/* token history  */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Registration Token History
                </h2>

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
                        {tokens.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-3 text-center text-gray-400">
                                No records found
                                </td>
                            </tr>
                        ): (
                            tokens.map((token)=>(
                                // for find everyline
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
            </div>



     {/* Onboarding applications review    */}
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Onboarding Applications Review
            </h2>
            <div className="grid grid-cols-3 gap-4">
         {/* pending list*/}
                <div>
                        <h3 className="font-medium text-yellow-600 mb-2">
                        Pending ({applications.pending.length})
                        </h3>
                       {applications.pending.length === 0 ? (
                        <p>No pending applications</p>):(
                             applications.pending.map((emp)=>(
                           <div key={emp._id} className="border rounded p-3 mb-2">
                            <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-gray-500">{emp.user?.email}</p>
                            <button
                            // if pending could be action.. 
                                onClick={() => setSelectedApplication({ ...emp, _action: 'pending' })}
                                className="text-blue-600 hover:underline text-xs mt-1"
                            >
                                View Application
                            </button>
                           </div>
                             ))
                        ) }
                </div>

    
     {/* approve list */}
        <div>
            <h3 className="font-medium text-green-600 mb-2">
                Approved ({applications.approved.length})
            </h3>
            {applications.approved.length===0?(
                <p>No Approved applications</p>
                ):(
                    applications.approved.map((emp)=>(
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
                )
                }
        </div>
        
        {/* reject */}
            <div>
                <h3 className="font-medium text-red-600 mb-2">
                    Rejected ({applications.rejected.length})
                </h3>
                {applications.rejected.length === 0 ? (
                    <p className="text-sm text-gray-400">No rejected applications</p>
                ):(
                    applications.rejected.map((emp)=>(
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
        </div>
    {/*  View Application Detail Panel */}
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

          {/* HR Feedback (if rejected) */}
          {selectedApplication.hrFeedback && (
            <div className="mt-4 p-3 bg-red-50 rounded">
              <p className="text-sm text-red-600">
                HR Feedback: {selectedApplication.hrFeedback}
              </p>
            </div>
          )}

          {/* Approve/Reject buttons - only for Pending */}
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






    )
 

}