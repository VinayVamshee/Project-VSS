import React, { forwardRef } from 'react';

const ReportToPrint = forwardRef(({ selectedCaseData, selectedFields, viewMode }, ref) => {
    if (!selectedCaseData || selectedCaseData.length === 0) {
        return <div ref={ref}><h2>No Data Selected</h2></div>;
    }

    return (
        <div ref={ref} className="p-4">
            <h2 className="mb-4 text-center">Case Report</h2>

            {viewMode === "table" ? (
                <div className="table-responsive">
                    <table className="table table-bordered table-striped table-sm">
                        <thead className="table-dark text-center align-middle">
                            <tr>
                                <th>S.No.</th>
                                {selectedFields.map((label, idx) => (
                                    <th key={idx} className="text-nowrap">{label}</th>
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
                                            <td key={idx}>{fields[label] !== undefined ? String(fields[label]) : '—'}</td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid-print-view">
                    {selectedCaseData.map((caseItem, index) => {
                        const fields = caseItem.inputFields || {};
                        return (
                            <div
                                key={caseItem._id || index}
                                className="border rounded mb-4 p-3 shadow-sm page-break mt-4"
                            >
                                <h5 className="mb-3 border-bottom pb-2">Case {index + 1}</h5>
                                <dl className="row">
                                    {selectedFields.map((field, idx) => (
                                        <React.Fragment key={idx}>
                                            <dt className="col-4 fw-bold">{field}</dt>
                                            <dd className="col-8">{fields[field] !== undefined ? String(fields[field]) : '—'}</dd>
                                        </React.Fragment>
                                    ))}
                                </dl>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

export default ReportToPrint;
