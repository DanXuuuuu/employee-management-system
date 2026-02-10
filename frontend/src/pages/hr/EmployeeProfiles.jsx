import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'; //redux hook 
import {  fetchEmployees, searchEmployees, fetchEmployeeDetail, clearSelectedEmployee } from '../../store/hrSlice'; 

export default function EmployeeProfiles() {
 
  // useDispatch: use for send "action，trigger Redux operate
  const dispatch = useDispatch();
  
  // useSelector: read data from Redux store 
  // state.hr hr reducer in store.js  
  const { employees, selectedEmployee, loading, error } = useSelector((state) => state.hr);
  
  //  Local state 
  // search input keep value in local state，cuz UI state dont need share
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); 

  // effects  
  // fetch all empployee when loading page
  useEffect(() => {
    // dispatch thunk  will trigger async operate
    dispatch(fetchEmployees());
  }, []);

  // Event Handlers 
  // search employee 
  const handleSearch = (value) => {
    setSearchQuery(value);

    // if search empty, re fetch all employees 
    if (!value.trim()) {
      dispatch(fetchEmployees());
      return;
    }

    // or call search api 
    dispatch(searchEmployees(value));
  };

  // check employee detail 
 
  const handleViewDetail = (id) => {
  if (isProcessing || loading.employees) return; //debounce 
  setIsProcessing(true); // set loading state 
   // dispatch call API automatically，store result in selectedEmployee
  dispatch(fetchEmployeeDetail(id)).finally(() => {
    setIsProcessing(false); //reset after finish
  });
};


  // close detail 
  const handleCloseDetail = () => {
    // call slice  custom action
    dispatch(clearSelectedEmployee());
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Employee Profiles
      </h1>

      {/* show error message */}
      {error.employees && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.employees}
        </div>
      )}

      {/* search input */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      {/* employee list */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          All Employees ({employees.length})
        </h2>

        {/* loading state */}
        {loading.employees ? (
          <div className="text-center py-8 text-gray-500">
            Loading employees...
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-center text-gray-400">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="border-t">
                    <td className="px-4 py-2">
                      {emp.lastName}, {emp.firstName}
                      {emp.preferredName && ` (${emp.preferredName})`}
                    </td>
                    <td className="px-4 py-2">{emp.email}</td>
                    <td className="px-4 py-2">{emp.phoneNumber}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        emp.applicationStatus === 'Approved'
                          ? 'bg-green-100 text-green-700'
                          : emp.applicationStatus === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {emp.applicationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                    onClick={() => handleViewDetail(emp._id)}
                    disabled={isProcessing || loading.employees}  
                    className="text-blue-600 hover:underline text-sm disabled:text-gray-400 disabled:cursor-not-allowed"  
                    >
                    {isProcessing ? 'Loading...' : 'View Detail'}  
                    </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* employee detail  */}
      {selectedEmployee && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Employee Detail
            </h2>
            <button
              onClick={handleCloseDetail}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-medium">
                {selectedEmployee.firstName} {selectedEmployee.middleName || ''} {selectedEmployee.lastName}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Preferred Name</p>
              <p className="font-medium">
                {selectedEmployee.preferredName || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{selectedEmployee.email}</p>
            </div>

            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{selectedEmployee.phoneNumber}</p>
            </div>

            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-medium">
                {new Date(selectedEmployee.dob).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-medium">{selectedEmployee.gender}</p>
            </div>

            <div>
              <p className="text-gray-500">SSN</p>
              <p className="font-medium">
                ***-**-{selectedEmployee.ssn?.slice(-4)}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Address</p>
              <p className="font-medium">
                {selectedEmployee.address?.building && `${selectedEmployee.address.building}, `}
                {selectedEmployee.address?.street}, {selectedEmployee.address?.city},{' '}
                {selectedEmployee.address?.state} {selectedEmployee.address?.zip}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Application Status</p>
              <p className="font-medium">{selectedEmployee.applicationStatus}</p>
            </div>

            <div>
              <p className="text-gray-500">Residency Status</p>
              <p className="font-medium">
                {selectedEmployee.residencyStatus?.isCitizenOrPermanentResident
                  ? selectedEmployee.residencyStatus.statusType
                  : selectedEmployee.residencyStatus?.workAuthorization?.type || 'N/A'}
              </p>
            </div>
          </div>

          {/* emergency contact */}
          {selectedEmployee.emergencyContacts?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-2">Emergency Contacts</h3>
              {selectedEmployee.emergencyContacts.map((contact, index) => (
                <div key={index} className="border rounded p-3 mb-2 text-sm">
                  <p className="font-medium">
                    {contact.firstName} {contact.lastName} ({contact.relationship})
                  </p>
                  <p className="text-gray-500">
                    Phone: {contact.phone} | Email: {contact.email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}