import { useState, useEffect } from 'react';
import api from '../../api';

export default function EmployeeProfiles() {
  // state variable 
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // fetch all employees when page loading 
  useEffect(() => {
    fetchEmployees();
  }, []);

  // get all employees func 
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/hr/employees');
      setEmployees(res.data.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  // search Employee 
  const handleSearch = async (value) => {
    setSearchQuery(value);

    // if search box empty, refetech all employees 
    if (!value.trim()) {
      fetchEmployees();
      return;
    }

    try {
        // query string 
      const res = await api.get(`/hr/employees/search?q=${value}`);
      setEmployees(res.data.data);
    } catch (err) {
      console.error('Failed to search employees:', err);
    }
  };

  //  check employee detail info  
  const handleViewDetail = async (id) => {
    try {
      const res = await api.get(`/hr/employees/${id}`);
      setSelectedEmployee(res.data.data);
    } catch (err) {
      console.error('Failed to fetch employee detail:', err);
    }
  };

  // close detail page 
  const handleCloseDetail = () => {
    // reset the selected employee
    setSelectedEmployee(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Employee Profiles
      </h1>

      {/*  search input   */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      {/* employee table */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          All Employees ({employees.length})
        </h2>

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
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* clicked view detail see employee detail */}
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
                {/* hide ssn only check last 4 digits */}
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