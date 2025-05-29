import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from "xlsx";

export default function InProgress() {
    const navigate = useNavigate();
    const [CaseData, setCaseData] = useState([]);
    const [formSchemas, setFormSchemas] = useState([]);
    const [editMode, setEditMode] = useState(null);
    const [updatedFields, setUpdatedFields] = useState({});
    const [filterType, setFilterType] = useState("All");
    const [filters, setFilters] = useState([]);
    const [selectedField, setSelectedField] = useState("");
    const [searchText, setSearchText] = useState("");

    const [userRole, setUserRole] = useState('');
     // eslint-disable-next-line 
    const [IsUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [IsAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

    useEffect(() => {
        const userToken = localStorage.getItem('userToken');
        const adminToken = localStorage.getItem('adminToken');
        const role = localStorage.getItem('userRole');

        if (!userToken && !adminToken) {
            navigate('/');
            return;
        }

        if (userToken) {
            setIsUserLoggedIn(true);
            setUserRole(role || '');
        } else {
            setIsUserLoggedIn(false);
            setUserRole('');
        }

        if (adminToken) {
            setIsAdminLoggedIn(true);
        } else {
            setIsAdminLoggedIn(false);
        }
    }, [navigate]);


    const fetchData = async () => {
        try {
            // Fetch cases
            const caseRes = await axios.get('https://vss-server.vercel.app/get-cases');
            const sortedCases = caseRes.data.sort((a, b) => a.SNo - b.SNo);
            setCaseData(sortedCases);

            // Fetch form schema
            const formRes = await axios.get('https://vss-server.vercel.app/get-forms');
            const sortedForms = formRes.data.sort((a, b) => a.SNo - b.SNo);
            setFormSchemas(sortedForms);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Function to close the case
    const closeCase = async (caseId) => {
        const confirmation = window.confirm(
            "Are you sure you want to close this case? This action cannot be undone."
        );

        if (confirmation) {
            try {
                await axios.put(`https://vss-server.vercel.app/close-case/${caseId}`);
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

    const filteredCases = CaseData.filter(caseItem => {
        if (caseItem.Closed === false) {
            const type = caseItem.inputFields?.["Type Of Check"];

            if (filterType === "DAR Action") {
                if (!caseItem.checkClose) return false;
            } else if (filterType !== "All") {
                if (type !== filterType || caseItem.checkClose) return false;
            }

            for (const { field, value } of filters) {
                let fieldValue = null;
                if (field.includes(" - ")) {
                    const subFieldLabel = field.split(" - ")[1];
                    fieldValue = caseItem.inputFields?.[subFieldLabel];
                } else {
                    fieldValue = caseItem.inputFields?.[field];
                }

                if (!fieldValue) return false;
                if (
                    typeof fieldValue === "string" &&
                    !fieldValue.toLowerCase().includes(value.toLowerCase())
                ) {
                    return false;
                }
            }

            return true;
        }
        return false;
    });


    const [selectedCases, setSelectedCases] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const handleDownloadExcel = () => {
        const selectedCaseData = CaseData.filter(caseItem => selectedCases.includes(caseItem._id));

        const formattedData = selectedCaseData.map(caseItem => {
            const flatCase = {
                _id: caseItem._id,
                Closed: caseItem.Closed,
                checkClose: caseItem.checkClose,
            };

            // Flatten inputFields
            if (caseItem.inputFields) {
                Object.entries(caseItem.inputFields).forEach(([key, value]) => {
                    flatCase[key] = value;
                });
            }

            return flatCase;
        });

        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cases");

        const today = new Date().toISOString().split("T")[0];
        XLSX.writeFile(wb, `Reports - ${today}.xlsx`);
    };

    return (
        <div className="Home">

            <div className="Grid">

                <div className='Filter-Grid'>

                    <div className='Filters'>
                        <button style={{ fontWeight: 'bold' }} className={`btn ${filterType === "All" ? "active" : ""}`} onClick={() => setFilterType("All")} >
                            All
                        </button>
                        <button style={{ fontWeight: 'bold' }} className={`btn ${filterType === "Preventive Check" ? "active" : ""}`} onClick={() => setFilterType("Preventive Check")} >
                            Preventive Check
                        </button>

                        <button style={{ fontWeight: 'bold' }} className={`btn ${filterType === "Decoy Check" ? "active" : ""}`} onClick={() => setFilterType("Decoy Check")} >
                            Decoy Check
                        </button>

                        <button style={{ fontWeight: 'bold' }} className={`btn ${filterType === "Complaint" ? "active" : ""}`} onClick={() => setFilterType("Complaint")} >
                            Complaints
                        </button>

                        <button style={{ fontWeight: 'bold' }} className={`btn ${filterType === "DAR Action" ? "active" : ""}`} onClick={() => setFilterType("DAR Action")} >
                            DAR Action
                        </button>
                    </div>


                    <div className="AllFilters Filters" >
                        <div className="">
                            <div className="input-group">

                                {/* Dynamic input box or select based on selected field */}
                                {(() => {
                                    let selectedConfig = null;

                                    for (const form of formSchemas) {
                                        for (const field of form.inputFields) {
                                            if (field.type === "group") {
                                                for (const subField of field.fields) {
                                                    if (`${field.label} - ${subField.label}` === selectedField) {
                                                        selectedConfig = {
                                                            type: "group-subfield",
                                                            config: subField,
                                                            parentLabel: field.label,
                                                        };
                                                        break;
                                                    }
                                                }
                                            } else {
                                                if (field.label === selectedField) {
                                                    selectedConfig = { type: field.type, config: field };
                                                    break;
                                                }
                                            }
                                            if (selectedConfig) break;
                                        }
                                        if (selectedConfig) break;
                                    }

                                    if (selectedConfig?.type === "option") {
                                        return (
                                            <select
                                                className="form-select"
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                            >
                                                <option value="">Select {selectedField}</option>
                                                {selectedConfig.config.fields.map((option, idx) => (
                                                    <option key={idx} value={option.label}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        );
                                    }

                                    // Default: show text input
                                    return (
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={`Enter search value for ${selectedField || "Select field"}`}
                                            value={searchText}
                                            onChange={(e) => setSearchText(e.target.value)}
                                        />
                                    );
                                })()}

                                {/* Dropdown for field selection */}
                                <button
                                    className="btn btn-outline-secondary dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="fa-brands fa-searchengin fa-xl me-2"></i>{selectedField || "Select field"}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    {formSchemas
                                        .flatMap((form) =>
                                            form.inputFields.flatMap((field) => {
                                                if (field.type === "group") {
                                                    return field.fields.map((subField) => ({
                                                        label: `${field.label} - ${subField.label}`,
                                                        key: `${field.label} - ${subField.label}`,
                                                    }));
                                                }
                                                return [{ label: field.label, key: field.label }];
                                            })
                                        )
                                        .map(({ label, key }, idx) => (
                                            <li key={idx}>
                                                <button
                                                    className="dropdown-item"
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedField(key);
                                                        setSearchText(""); // reset search value
                                                    }}
                                                >
                                                    {label}
                                                </button>
                                            </li>
                                        ))}
                                </ul>

                                {/* Add Filter Button */}
                                <button
                                    className="btn btn-outline-primary ms-2"
                                    type="button"
                                    onClick={() => {
                                        if (selectedField && searchText) {
                                            setFilters([...filters, { field: selectedField, value: searchText }]);
                                            setSelectedField("");
                                            setSearchText("");
                                        }
                                    }}
                                >
                                    <i className="fa-solid fa-filter fa-lg me-2"></i>Add Filter
                                </button>

                                {/* Reset all filters */}
                                <button
                                    className="btn btn-outline-danger mx-2"
                                    type="button"
                                    onClick={() => {
                                        setSelectedField("");
                                        setSearchText("");
                                        setFilters([]);
                                    }}
                                >
                                    <i className="fa-solid fa-xmark fa-lg me-2"></i>Reset
                                </button>
                                <div className='btn me-2'>
                                    <input type="checkbox" checked={selectAll} onChange={(e) => {
                                        const checked = e.target.checked;
                                        setSelectAll(checked);
                                        if (checked) {
                                            const allVisibleCaseIds = filteredCases.map((c) => c._id);
                                            setSelectedCases(allVisibleCaseIds);
                                        } else {
                                            setSelectedCases([]);
                                        }
                                    }}
                                    />
                                    <label className="ms-2">Select All</label>
                                </div>
                                <button className="btn" onClick={handleDownloadExcel}>
                                    <i className="fa-solid fa-file-excel me-2"></i> Download Excel
                                </button>
                            </div>


                        </div>

                        {/* Show active filters */}
                        <div style={{ margin: '0px 0px 0px 0px', padding: '0px' }}>
                            {filters.map((f, idx) => (
                                <span key={idx} className=" me-2" style={{ backgroundColor: 'lightYellow', borderRadius: '10px', padding: '7px 10px', color: 'black', fontWeight: 'bold' }}>
                                    {f.field}: {f.value}
                                    <button
                                        type="button"
                                        className="btn-close ms-2"
                                        onClick={() =>
                                            setFilters(filters.filter((_, i) => i !== idx))
                                        }
                                    />
                                </span>
                            ))}
                        </div>
                    </div>

                </div>




                {filteredCases.length > 0 ? (
                    filteredCases.map((caseItem, index) => {
                        const collapseId = `collapseCaseInfo-${index}`;
                        const caseDetails = caseItem.inputFields || {};
                        return (
                            <div key={index} className="Case-Item" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="Case-OverView">
                                    <div className="Base-Case">
                                        <i
                                            className={`fa-solid fa-circle-half-stroke fa-xl select-icon ${selectedCases.includes(caseItem._id) ? 'rotate' : ''}`}
                                            style={{
                                                color: selectedCases.includes(caseItem._id) ? 'blue' : 'goldenrod',
                                                cursor: 'pointer',
                                                transition: 'color 0.3s ease',
                                            }}
                                            onClick={(e) => {
                                                e.currentTarget.classList.add('rotate');
                                                setSelectedCases((prev) => {
                                                    if (prev.includes(caseItem._id)) {
                                                        return prev.filter(id => id !== caseItem._id);
                                                    } else {
                                                        return [...prev, caseItem._id];
                                                    }
                                                });
                                            }}
                                        ></i>
                                        <div>{caseDetails['PC-DC Number']}</div>
                                        <div><span style={{ fontWeight: 'bold' }}>DOC :</span> {caseDetails["Date Of Check"] || "Not filled"}</div>
                                        <div><span style={{ fontWeight: 'bold' }}></span> {caseDetails["Division"] || "Not filled"}</div>
                                        <div><span style={{ fontWeight: 'bold' }}></span> {caseDetails["Department"] || "Not filled"}</div>
                                        <div><span style={{ fontWeight: 'bold' }}>Name of CVI :</span> {caseDetails["Name Of Concern VI"] || "Not filled"}</div>
                                        <div><span style={{ fontWeight: 'bold' }}>Decision :</span> {caseDetails["SDGM Decision/Recommendation"] || "Not filled"}</div>
                                    </div>

                                    {
                                        filterType !== "All" &&
                                        (IsAdminLoggedIn || filterType === userRole) && (
                                            <>
                                                {editMode === caseItem._id ? (
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => {
                                                            setEditMode(null);
                                                            setUpdatedFields({});
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        style={{ whiteSpace: 'nowrap' }}
                                                        onClick={() => {
                                                            setEditMode(caseItem._id);
                                                            setUpdatedFields(caseItem.inputFields || {});
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-pen-to-square fa-lg me-2"></i> Edit Case
                                                    </button>
                                                )}
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
                                            </>
                                        )
                                    }




                                </div>

                                <div className="collapse w-100 mt-2" id={collapseId}>
                                    <div className="container-fluid">
                                        <div className="row">
                                            {formSchemas.map((form, formIndex) =>
                                                Array.isArray(form.showIn) && form.showIn.includes(filterType) &&
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
                                                                                type={subField.label.toLowerCase().includes("date") ? "date" : "text"}
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
                                                                    type={inputField.label.toLowerCase().includes("date") ? "date" : "text"}
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
                                                                await axios.put(`https://vss-server.vercel.app/update-case/${caseItem._id}`, {
                                                                    inputFields: updatedFields,
                                                                    closed: caseItem.Closed
                                                                });
                                                                alert('Case updated successfully');
                                                                setEditMode(null);
                                                                setUpdatedFields({});
                                                                fetchData();
                                                            } catch (err) {
                                                                console.error('Update error:', err);
                                                                alert('Failed to update case');
                                                            }
                                                        }}
                                                    >
                                                        Save
                                                    </button>

                                                </>
                                            ) :
                                                <>
                                                    {caseItem.checkClose && (
                                                        <button
                                                            className="btn btn-sm btn-secondary me-2"
                                                            onClick={async () => {
                                                                try {
                                                                    await axios.put(`https://vss-server.vercel.app/transfer-stage/${caseItem._id}`, {
                                                                        checkClose: false
                                                                    });
                                                                    alert('Case moved back to previous stage');
                                                                    fetchData();
                                                                } catch (error) {
                                                                    console.error('Error moving back:', error);
                                                                    alert('Action failed');
                                                                }
                                                            }}
                                                        >
                                                            Move back to previous stage
                                                        </button>
                                                    )}
                                                    <button className="btn btn-sm btn-danger me-2" onClick={() => closeCase(caseItem._id)} disabled={caseItem.status === 'Closed'} > Close Complete Case </button>
                                                    {!caseItem.checkClose && (
                                                        <button
                                                            className="btn btn-sm btn-info me-2"
                                                            onClick={async () => {
                                                                try {
                                                                    await axios.put(`https://vss-server.vercel.app/transfer-stage/${caseItem._id}`, {
                                                                        checkClose: true
                                                                    });
                                                                    alert('Case transferred to DAR Action');
                                                                    fetchData();
                                                                } catch (error) {
                                                                    console.error('Error transferring to DAR:', error);
                                                                    alert('Transfer failed');
                                                                }
                                                            }}
                                                        >
                                                            Transfer to DAR Action
                                                        </button>
                                                    )}
                                                </>
                                            }
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
