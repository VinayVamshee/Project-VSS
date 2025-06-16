import React, { forwardRef } from 'react';

const ReportToPrint = forwardRef(({ selectedCaseData, fieldsToPrint, viewMode }, ref) => {
    if (!selectedCaseData || selectedCaseData.length === 0) {
        return <div ref={ref}><h2>No Data Selected</h2></div>;
    }

    return (
        <div ref={ref} className="p-3" style={{ background: 'white' }}>
            {/* Heading and content together to avoid page break */}
            <div className="text-center mb-3 pb-2 border-bottom">
                <h2 className="mb-1" style={{ fontSize: "20px" }}>South East Central Railway</h2>
                <h3 className="mb-0" style={{ fontSize: "16px" }}>Vigilance Branch</h3>
            </div>

            {viewMode === "table" ? (
                <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                        <thead className="text-center align-middle">
                            <tr>
                                <th>S.No.</th>
                                {fieldsToPrint.map((label, idx) => (
                                    <th key={idx}>{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {selectedCaseData.map((caseItem, index) => {
                                const fields = caseItem.inputFields || {};
                                return (
                                    <tr key={caseItem._id || index}>
                                        <td>{index + 1}</td>
                                        {fieldsToPrint.map((label, idx) => (
                                            <td key={idx}>{fields[label] !== undefined ? String(fields[label]) : '—'}</td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="w-100">
                    <div className="row gx-3 gy-4">
                        {selectedCaseData.map((caseItem, index) => {
                            const fields = caseItem.inputFields || {};

                            // Group fields into pairs for horizontal layout
                            const fieldPairs = [];
                            for (let i = 0; i < fieldsToPrint.length; i += 2) {
                                fieldPairs.push(fieldsToPrint.slice(i, i + 2));
                            }

                            return (
                                <div key={caseItem._id || index} className="col-12 case-container">
                                    <div className="border rounded p-4 shadow-sm bg-white">
                                        <div className="mb-3 pb-2 border-bottom">
                                            <h5 className="mb-0 fw-bold text-primary">Case {index + 1}</h5>
                                        </div>
                                        <div className="container-fluid px-0">
                                            {fieldPairs.map((pair, pairIndex) => (
                                                <div className="row align-items-start mb-2" key={pairIndex}>
                                                    {pair.map((field, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <div className="col-3 fw-semibold text-muted small text-uppercase">
                                                                {field}
                                                            </div>
                                                            <div className="col-3 text-dark small">
                                                                {fields[field] !== undefined ? String(fields[field]) : '—'}
                                                            </div>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

export default ReportToPrint;
