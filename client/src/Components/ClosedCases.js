import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ClosedCases() {
    const [CaseData, setCaseData] = useState([]);
    const [formSchemas, setFormSchemas] = useState([]);
    const [filterType, setFilterType] = useState("All");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch cases
                const caseRes = await axios.get('http://localhost:3001/get-cases');
                const sortedCases = caseRes.data.sort((a, b) => a.SNo - b.SNo);
                setCaseData(sortedCases);

                // Fetch form schema
                const formRes = await axios.get('http://localhost:3001/get-forms');
                const sortedForms = formRes.data.sort((a, b) => a.SNo - b.SNo);
                setFormSchemas(sortedForms);
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };

        fetchData();
    }, []);

    // Function to close the case
    // const closeCase = async (caseId) => {
    //     const confirmation = window.confirm(
    //         "Are you sure you want to close this case? This action cannot be undone."
    //     );

    //     if (confirmation) {
    //         try {
    //             await axios.put(`http://localhost:3001/close-case/${caseId}`);
    //             alert('Case closed successfully');
    //             setCaseData((prevData) =>
    //                 prevData.map((caseItem) =>
    //                     caseItem._id === caseId ? { ...caseItem, status: 'Closed' } : caseItem
    //                 )
    //             );
    //         } catch (err) {
    //             console.error('Close case error:', err);
    //             alert('Failed to close case');
    //         }
    //     } else {
    //         alert("Case closure has been canceled.");
    //     }
    // };

    return (
        <div className="Home">
            <div className="Grid">

                <div className='Filters'>
                    <button className={`btn ${filterType === "All" ? "active" : ""}`} onClick={() => setFilterType("All")} >
                        All
                    </button>
                    <button className={`btn ${filterType === "Preventive Check" ? "active" : ""}`} onClick={() => setFilterType("Preventive Check")} >
                        Preventive Check
                    </button>

                    <button className={`btn ${filterType === "Decoy Check" ? "active" : ""}`} onClick={() => setFilterType("Decoy Check")} >
                        Decoy Check
                    </button>

                    <button className={`btn ${filterType === "Complaint" ? "active" : ""}`} onClick={() => setFilterType("Complaint")} >
                        <i className="fa-solid fa-box-archive fa-lg me-2"></i>Complaints
                    </button>

                    <button className={`btn ${filterType === "DAR Action" ? "active" : ""}`} onClick={() => setFilterType("DAR Action")} >
                        <i className="fa-solid fa-user-secret fa-lg me-2"></i>DAR Action
                    </button>


                </div>

                <div className="Filters">
                    <button className="btn"><i class="fa-solid fa-calendar-days fa-lg  me-2"></i>Start Date</button>
                    <button className="btn"><i class="fa-solid fa-calendar-days fa-lg  me-2"></i>End Date</button>
                    <button className="btn"><i class="fa-solid fa-user-tie fa-lg me-2"></i>Operated By</button>
                </div>

                {CaseData.filter(caseItem => {
    if (filterType === "DAR Action") {
        return caseItem.Closed === true && caseItem.checkClose === true;
    }
    return caseItem.Closed === true || caseItem.checkClose === true;
}).length > 0 ? (
    CaseData.filter(caseItem => {
        if (filterType === "DAR Action") {
            return caseItem.Closed === true && caseItem.checkClose === true;
        }
        const type = caseItem.inputFields?.["Type Of Check"];
        return (caseItem.Closed === true || caseItem.checkClose === true) &&
               (filterType === "All" || type === filterType);
    }).map((caseItem, index) => {
                        const collapseId = `collapseCaseInfo-${index}`;
                        const caseDetails = caseItem.inputFields || {};

                        return (
                            <div key={index} className="Case-Item" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="Case-OverView">
                                    <div className="Base-Case">
                                        <i className="fa-solid fa-circle-check fa-xl" style={{ color: caseItem.Closed ? 'green' : (caseItem.checkClose ? 'goldenrod' : 'gray') }}></i>
                                        {/* <div>S.No. {caseItem.SNo}</div> */}
                                        <div>Type of Check - {caseDetails["Type Of Check"] || "Not filled"}</div>
                                        <div>Date of Check - {caseDetails["Date Of Check"] || "Not filled"}</div>
                                        <div>Department - {caseDetails["Department"] || "Not filled"}</div>
                                    </div>


                                    {/* ReOpen Case Button */}
                                    <button
                                        className="btn btn-sm btn-info" style={{ whiteSpace: 'nowrap' }}
                                        onClick={async () => {
                                            const confirmation = window.confirm("Are you sure you want to reopen this case?");
                                            if (confirmation) {
                                                try {
                                                    await axios.put(`http://localhost:3001/reopen-case/${caseItem._id}`);
                                                    alert('Case reopened successfully');
                                                    setCaseData((prevData) =>
                                                        prevData.map((caseItem) =>
                                                            // eslint-disable-next-line
                                                            caseItem._id === caseItem._id ? { ...caseItem, Closed: false } : caseItem
                                                        )
                                                    );
                                                } catch (err) {
                                                    console.error('Reopen case error:', err);
                                                    alert('Failed to reopen case');
                                                }
                                            } else {
                                                alert("Reopening case has been canceled.");
                                            }
                                        }}
                                    >
                                        <i class="fa-solid fa-envelope-open-text fa-xl me-2"></i>Re-Open Case
                                    </button>
                                    <button className="btn" type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded="false" aria-controls={collapseId} >
                                        <i className="fa-solid fa-square-caret-up fa-rotate-180 fa-lg"></i>
                                    </button>
                                </div>

                                <div className="collapse w-100 mt-2" id={collapseId}>
                                    <div className="container-fluid">
                                        <div className="row">
                                            {formSchemas.map((form, formIndex) =>
                                                form.showIn.includes("DC") &&
                                                form.inputFields.map((inputField, index) => (
                                                    <div
                                                        key={`${formIndex}-${index}`}
                                                        className={inputField.type === "group" ? "col-12 mb-3" : "col-12 col-sm-6 col-md-3 mb-3"}
                                                    >
                                                        {inputField.type === "group" ? (
                                                            <div>
                                                                <p className="fw-bold">{inputField.label}:</p>
                                                                <div className="row">
                                                                    {inputField.fields.map((subField, idx) => (
                                                                        <div key={idx} className="col-12 col-sm-6 col-md-3 mb-2">
                                                                            <label>{subField.label}:</label>
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                placeholder={`Enter ${subField.label}`}
                                                                                value={caseDetails[subField.label] ?? ""}
                                                                                disabled
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : inputField.type === "option" ? (
                                                            <div>
                                                                <p className="fw-bold">{inputField.label}:</p>
                                                                <select
                                                                    className="form-select"
                                                                    disabled
                                                                    value={caseDetails[inputField.label] ?? ""}
                                                                >
                                                                    <option value="">Select</option>
                                                                    {inputField.fields.map((subField, idx) => (
                                                                        <option key={idx} value={subField.label}>
                                                                            {subField.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <p className="fw-bold">{inputField.label}:</p>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder={`Enter ${inputField.label}`}
                                                                    value={caseDetails[inputField.label] ?? ""}
                                                                    disabled
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>No cases available.</p>
                )}
            </div>
        </div>
    );
}
