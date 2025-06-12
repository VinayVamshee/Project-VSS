import React, { forwardRef } from 'react';

const ReportToPrint = forwardRef(({ selectedCaseData, selectedFields }, ref) => {
  if (!selectedCaseData || selectedCaseData.length === 0) {
    return <div ref={ref}><h2>No Data Selected</h2></div>;
  }

  return (
    <div ref={ref} className="p-4">
      <h2 className="mb-4 text-center">Selected Case Report</h2>
      <div className="table-responsive">
        <table className="table table-bordered table-striped table-sm">
          <thead className="table-dark text-center align-middle">
            <tr>
              <th scope="col" className="text-nowrap">S.No.</th>
              {selectedFields.map((label, idx) => (
                <th key={idx} scope="col" className="text-nowrap">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedCaseData.map((caseItem, index) => {
              const fields = caseItem.inputFields || {};
              return (
                <tr key={caseItem._id || index}>
                  <td>{index + 1}</td>
                  {selectedFields.map((label, idx) => (
                    <td key={idx}>
                      {fields[label] !== undefined ? String(fields[label]) : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default ReportToPrint;
