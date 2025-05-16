import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
    const [CaseData, setCaseData] = useState([]);
    const [formSchemas, setFormSchemas] = useState([]);
    const [editMode, setEditMode] = useState(null);
    const [updatedFields, setUpdatedFields] = useState({});
    const [isInProgress, setIsInProgress] = useState(true);

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
    const closeCase = async (caseId) => {
        const confirmation = window.confirm(
            "Are you sure you want to close this case? This action cannot be undone."
        );

        if (confirmation) {
            try {
                await axios.put(`http://localhost:3001/close-case/${caseId}`);
                alert('Case closed successfully');
                setCaseData((prevData) =>
                    prevData.map((caseItem) =>
                        caseItem._id === caseId ? { ...caseItem, status: 'Closed' } : caseItem
                    )
                );
            } catch (err) {
                console.error('Close case error:', err);
                alert('Failed to close case');
            }
        } else {
            alert("Case closure has been canceled.");
        }
    };

    return (
        <div className="Home">

            <div className="StatusBar">
                <button className={`Status ${isInProgress ? 'active' : ''}`} onClick={() => setIsInProgress(true)} > <i className="fa-solid fa-circle-dot me-1" style={{ color: '#ffc800' }}></i> In Progress </button>
                <button className={`Status ${!isInProgress ? 'active' : ''}`} onClick={() => setIsInProgress(false)} > <i className="fa-solid fa-circle-dot me-1" style={{ color: 'red' }}></i> Completed </button>
            </div>

            <div className="Grid">
                <div className="Filters">
                    <button className="btn">Start Date</button>
                    <button className="btn">End Date</button>
                    <button className="btn">Operated By</button>
                </div>
                {
                    isInProgress ?
                        <>
                            {CaseData.filter(caseItem => caseItem.Closed === false).length > 0 ? (
                                CaseData.filter(caseItem => caseItem.Closed === false).map((caseItem, index) => {
                                    const collapseId = `collapseCaseInfo-${index}`;
                                    const caseDetails = caseItem.inputFields || {};

                                    return (
                                        <div key={index} className="Case-Item">
                                            <div className="Case-OverView">
                                                <div className="Base-Case">
                                                    <div>S.No. {caseItem.SNo}</div>
                                                    <div>Type of Check - {caseDetails["Type Of Check"] || "Not filled"}</div>
                                                    <div>Date of Check - {caseDetails["Date Of Check"] || "Not filled"}</div>
                                                    <div>Department - {caseDetails["Department"] || "Not filled"}</div>
                                                </div>
                                                {editMode === caseItem._id ? (
                                                    <button className="btn btn-sm btn-secondary" onClick={() => { setEditMode(null); setUpdatedFields({}); }} > Cancel </button>
                                                ) : (
                                                    <button className="btn btn-sm btn-warning" style={{ whiteSpace: 'nowrap' }} onClick={() => { setEditMode(caseItem._id); setUpdatedFields(caseItem.inputFields || {}); }} > <i className="fa-solid fa-pen-to-square fa-lg me-2"></i> Edit Case </button>
                                                )}
                                                <button className="btn" type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded="false" aria-controls={collapseId} > <i className="fa-solid fa-square-caret-up fa-rotate-180 fa-lg"></i> </button>
                                                {/* Close case button */}
                                            </div>

                                            <div className="collapse w-100 mt-2" id={collapseId}>
                                                <div className="container-fluid">
                                                    <div className="row">
                                                        {formSchemas.map((form, formIndex) =>
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
                                                                                            value={
                                                                                                editMode === caseItem._id
                                                                                                    ? updatedFields[subField.label] ?? caseDetails[subField.label] ?? ""
                                                                                                    : caseDetails[subField.label] ?? ""
                                                                                            }
                                                                                            disabled={editMode !== caseItem._id}
                                                                                            onChange={(e) => {
                                                                                                if (editMode === caseItem._id) {
                                                                                                    setUpdatedFields((prev) => ({
                                                                                                        ...prev,
                                                                                                        [subField.label]: e.target.value
                                                                                                    }));
                                                                                                }
                                                                                            }}
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
                                                                                disabled={editMode !== caseItem._id}
                                                                                value={
                                                                                    editMode === caseItem._id
                                                                                        ? updatedFields[inputField.label] ?? caseDetails[inputField.label] ?? ""
                                                                                        : caseDetails[inputField.label] ?? ""
                                                                                }
                                                                                onChange={(e) => {
                                                                                    if (editMode === caseItem._id) {
                                                                                        setUpdatedFields((prev) => ({
                                                                                            ...prev,
                                                                                            [inputField.label]: e.target.value
                                                                                        }));
                                                                                    }
                                                                                }}
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
                                                                                value={
                                                                                    editMode === caseItem._id
                                                                                        ? updatedFields[inputField.label] ?? caseDetails[inputField.label] ?? ""
                                                                                        : caseDetails[inputField.label] ?? ""
                                                                                }
                                                                                disabled={editMode !== caseItem._id}
                                                                                onChange={(e) => {
                                                                                    if (editMode === caseItem._id) {
                                                                                        setUpdatedFields((prev) => ({
                                                                                            ...prev,
                                                                                            [inputField.label]: e.target.value
                                                                                        }));
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="mt-3">
                                                        {editMode === caseItem._id ? (
                                                            <>
                                                                <button
                                                                    className="btn btn-sm btn-success me-2"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await axios.put(`http://localhost:3001/update-case/${caseItem._id}`, {
                                                                                inputFields: updatedFields
                                                                            });
                                                                            alert('Case updated successfully');
                                                                            setEditMode(null);
                                                                            setUpdatedFields({});
                                                                            window.location.reload(); // or re-fetch data
                                                                        } catch (err) {
                                                                            console.error('Update error:', err);
                                                                            alert('Failed to update case');
                                                                        }
                                                                    }}
                                                                >
                                                                    Save
                                                                </button>

                                                            </>
                                                        ) : <button className="btn btn-sm btn-danger" onClick={() => closeCase(caseItem._id)} disabled={caseItem.status === 'Closed'} > Close Case </button>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>No cases available.</p>
                            )}
                        </>
                        :
                        <>
                            {CaseData.filter(caseItem => caseItem.Closed === true).length > 0 ? (
                                CaseData.filter(caseItem => caseItem.Closed === true).map((caseItem, index) => {
                                    const collapseId = `collapseCaseInfo-${index}`;
                                    const caseDetails = caseItem.inputFields || {};

                                    return (
                                        <div key={index} className="Case-Item">
                                            <div className="Case-OverView">
                                                <div className="Base-Case">
                                                    <div>S.No. {caseItem.SNo}</div>
                                                    <div>Type of Check - {caseDetails["Type Of Check"] || "Not filled"}</div>
                                                    <div>Date of Check - {caseDetails["Date Of Check"] || "Not filled"}</div>
                                                    <div>Department - {caseDetails["Department"] || "Not filled"}</div>
                                                </div>
                                                <button
                                                    className="btn"
                                                    type="button"
                                                    data-bs-toggle="collapse"
                                                    data-bs-target={`#${collapseId}`}
                                                    aria-expanded="false"
                                                    aria-controls={collapseId}
                                                >
                                                    <i className="fa-solid fa-square-caret-up fa-rotate-180 fa-lg"></i>
                                                </button>

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
                                                    ReOpen Case
                                                </button>
                                            </div>

                                            <div className="collapse w-100 mt-2" id={collapseId}>
                                                <div className="container-fluid">
                                                    <div className="row">
                                                        {formSchemas.map((form, formIndex) =>
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

                        </>
                }

            </div>
        </div>
    );
}
