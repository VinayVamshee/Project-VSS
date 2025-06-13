import React, { forwardRef } from 'react';

const ReportToPrint = forwardRef(({ selectedCaseData, selectedFields, viewMode }, ref) => {
    if (!selectedCaseData || selectedCaseData.length === 0) {
        return <div ref={ref}><h2>No Data Selected</h2></div>;
    }

    return (
        <div ref={ref} className="p-4">
            <h2 className="mb-1 text-center">South East Central Railway</h2>
            <h3 className='mb-4 text-center'>Vigilance Branch</h3>

            {viewMode === "table" ? (
                <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                        <thead className="text-center align-middle">
                            <tr>
                                <th>S.No.</th>
                                {selectedFields.map((label, idx) => (
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
                <div className="w-100">
                    <div className="row g-4">
                        {selectedCaseData.map((caseItem, index) => {
                            const fields = caseItem.inputFields || {};
                            const half = Math.ceil(selectedFields.length / 2);
                            const leftFields = selectedFields.slice(0, half);
                            const rightFields = selectedFields.slice(half);

                            return (
                                <div
                                    key={caseItem._id || index}
                                    className="col-12"
                                >
                                    <div className="border border-dark-subtle rounded p-4 shadow-sm page-break">
                                        <h5 className="mb-4  pb-2">Case {index + 1}</h5>
                                        <div className="row">
                                            {/* Left Column */}
                                            <div className="col-6">
                                                <dl className="row">
                                                    {leftFields.map((field, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <dt className="col-5 fw-semibold  py-1">{field}</dt>
                                                            <dd className="col-7  py-1">
                                                                {fields[field] !== undefined ? String(fields[field]) : '—'}
                                                            </dd>
                                                        </React.Fragment>
                                                    ))}
                                                </dl>
                                            </div>

                                            {/* Right Column */}
                                            <div className="col-6">
                                                <dl className="row">
                                                    {rightFields.map((field, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <dt className="col-5 fw-semibold  py-1">{field}</dt>
                                                            <dd className="col-7  py-1">
                                                                {fields[field] !== undefined ? String(fields[field]) : '—'}
                                                            </dd>
                                                        </React.Fragment>
                                                    ))}
                                                </dl>
                                            </div>
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
