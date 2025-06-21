import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from "xlsx";
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import ReportToPrint from './ReportToPrint';

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
    const [statusMessage, setStatusMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // "success" or "danger"

    const [userRole, setUserRole] = useState('');
    // eslint-disable-next-line 
    const [IsUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [IsAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [authToken, setAuthToken] = useState('');

    useEffect(() => {
        const userToken = localStorage.getItem('userToken');
        const adminToken = localStorage.getItem('adminToken');
        const role = localStorage.getItem('userRole');

        if (!userToken && !adminToken) {
            navigate('/');
            return;
        }

        if (adminToken) {
            setIsAdminLoggedIn(true);
            setAuthToken(adminToken);
            setUserRole('admin');
        } else if (userToken) {
            setIsUserLoggedIn(true);
            setAuthToken(userToken);
            setUserRole(role || '');
        }
    }, [navigate]);

    const [loadingData, setLoadingData] = useState(true);
    const [closingCaseId, setClosingCaseId] = useState(null); // For per-case loading indicator

    const fetchData = async () => {
        setLoadingData(true);
        try {
            // Fetch cases
            const caseRes = await axios.get('https://vss-server.vercel.app/get-cases', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const sortedCases = caseRes.data.sort((a, b) => a.SNo - b.SNo);
            setCaseData(sortedCases);

            const formRes = await axios.get('https://vss-server.vercel.app/get-forms');

            const sortedForms = formRes.data.sort((a, b) => a.SNo - b.SNo);
            setFormSchemas(sortedForms);
        } catch (err) {
            console.error('❌ Error during fetchData:', err.response?.data || err.message || err);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (authToken) {
            fetchData();
        }
        // eslint-disable-next-line
    }, [authToken]);

    // Function to close the case
    const closeCase = async (caseId) => {
        const confirmation = window.confirm("Are you sure you want to close this case?");
        if (!confirmation) return;

        setClosingCaseId(caseId);
        try {
            await axios.put(`https://vss-server.vercel.app/close-case/${caseId}`);

            // ✅ Show success message
            setStatusMessage("Case closed successfully");
            setMessageType("success");

            setCaseData(prev =>
                prev.map(item =>
                    item._id === caseId ? { ...item, status: 'Closed' } : item
                )
            );
            fetchData();
        } catch (err) {
            console.error('Close case error:', err);

            // ❌ Show error message
            setStatusMessage("Failed to close case");
            setMessageType("danger");
        } finally {
            setClosingCaseId(null);
        }
    };
    const filteredCases = CaseData.filter((caseItem) => {
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

                // Check for date range format
                if (typeof value === "string" && value.includes(" to ")) {
                    const [fromStr, toStr] = value.split(" to ");
                    const fromDate = new Date(fromStr);
                    const toDate = new Date(toStr);
                    const actualDate = new Date(fieldValue);

                    if (
                        isNaN(fromDate.getTime()) ||
                        isNaN(toDate.getTime()) ||
                        isNaN(actualDate.getTime())
                    ) {
                        return false; // any invalid date: skip
                    }

                    if (actualDate < fromDate || actualDate > toDate) {
                        return false; // outside range
                    }
                } else {
                    // Normal string matching
                    if (
                        typeof fieldValue === "string" &&
                        !fieldValue.toLowerCase().includes(value.toLowerCase())
                    ) {
                        return false;
                    }
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

            if (caseItem.inputFields) {
                Object.entries(caseItem.inputFields).forEach(([key, value]) => {
                    flatCase[key] = value;
                });
            }

            return flatCase;
        });

        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Insert a blank row AFTER headers (i.e., between row 1 and 2)
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.e.r; R >= 1; --R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell) {
                    ws[XLSX.utils.encode_cell({ r: R + 1, c: C })] = { ...cell };
                    delete ws[XLSX.utils.encode_cell({ r: R, c: C })];
                }
            }
        }

        // Expand the range to reflect the shifted data
        range.e.r += 1;
        ws['!ref'] = XLSX.utils.encode_range(range);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cases");

        const today = new Date().toISOString().split("T")[0];
        XLSX.writeFile(wb, `Reports - ${today}.xlsx`);
    };

    const componentRef = useRef(null);
    // const getMatchingFieldKeys = (selectedLabels, inputFields) => {
    //     return Object.keys(inputFields).filter((fieldKey) =>
    //         selectedLabels.some((label) =>
    //             fieldKey === label || fieldKey.startsWith(`${label}_`)
    //         )
    //     );
    // };
    const selectedCaseData = CaseData.filter(caseItem => selectedCases.includes(caseItem._id));
    const [selectedFields, setSelectedFields] = useState([]);
    const [allFieldLabels, setAllFieldLabels] = useState([]);
    const [fieldsToPrint, setFieldsToPrint] = useState([]);

    const prepareFieldsToPrint = () => {
        const mergedKeys = new Set();

        selectedFields.forEach((label) => {
            let foundMatch = false;

            selectedCaseData.forEach((caseItem) => {
                const inputFields = caseItem.inputFields || {};

                Object.keys(inputFields).forEach((key) => {
                    if (key === label || key.startsWith(`${label}_`)) {
                        mergedKeys.add(key);
                        foundMatch = true;
                    }
                });
            });

            if (!foundMatch) {
                // Even if no matching key was found in any case, add the base label
                mergedKeys.add(label);
            }
        });

        setFieldsToPrint([...mergedKeys]);
    };

    useEffect(() => {
        const labelSet = new Set();
        formSchemas.forEach((form) => {
            form.inputFields.forEach((field) => {
                if (field.type === "group") {
                    field.fields.forEach((subField) => {
                        labelSet.add(subField.label);
                    });
                } else {
                    labelSet.add(field.label);
                }
            });
        });

        const allLabelsArray = [...labelSet];

        setAllFieldLabels((prev) =>
            JSON.stringify(prev) !== JSON.stringify(allLabelsArray) ? allLabelsArray : prev
        );
    }, [formSchemas]);

    const toggleFieldSelection = (label) => {
        setSelectedFields((prev) =>
            prev.includes(label)
                ? prev.filter((l) => l !== label)
                : [...prev, label]
        );
    };

    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Pending Cases - ${filterType || 'All'} - Case Report - ${formattedDate} `,
    });

    const [viewMode, setViewMode] = useState("table");

    const [openCollapses, setOpenCollapses] = useState([]);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [selectedDateRangeField, setSelectedDateRangeField] = useState("");
    const [transferringCaseId, setTransferringCaseId] = useState(null);
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => {
                setStatusMessage("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    const [groupCollapseStates, setGroupCollapseStates] = useState({});



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

                    <div className="AllFilters" >

                        <div className="input-group">
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
                            <button className="btn me-2" type="button" data-bs-toggle="collapse" data-bs-target="#dateFilterCollapse" aria-expanded="false" aria-controls="dateFilterCollapse" >
                                <i className="bi bi-calendar-range me-2"></i>
                                {selectedDateRangeField && dateRange.from && dateRange.to
                                    ? `${selectedDateRangeField}: ${dateRange.from} → ${dateRange.to}`
                                    : "Select Date Range"}
                            </button>
                            <button
                                className="btn dropdown-toggle"
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

                            {/* Add Filter Button */}
                            <button
                                className="btn ms-2"
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
                                className="btn mx-2"
                                type="button"
                                onClick={() => {
                                    setSelectedField("");
                                    setSearchText("");
                                    setFilters([]);
                                }}
                            >
                                <i className="fa-solid fa-xmark fa-lg me-2"></i>Reset
                            </button>
                            <button className="btn" onClick={handleDownloadExcel}>
                                <i className="fa-solid fa-file-excel me-2"></i> Excel
                            </button>
                            <button className="btn" data-bs-toggle="modal" data-bs-target="#fieldSelectModal">
                                <i className="fa-solid fa-file-pdf me-2"></i> Report
                            </button>
                        </div>
                        {/* Collapsible Filter Section */}
                        <div className="collapse " id="dateFilterCollapse">
                            <div className="d-flex align-items-center gap-2 flex-wrap">

                                {/* Dropdown to select Date Field */}
                                <div className="dropdown">
                                    <button className="btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" > {selectedDateRangeField || "Choose Date Field"} </button>
                                    <ul className="dropdown-menu">
                                        {formSchemas.flatMap((form) =>
                                            form.inputFields.flatMap((field) => {
                                                if (field.type === "group") {
                                                    return field.fields
                                                        .filter((sub) =>
                                                            `${field.label} - ${sub.label}`.toLowerCase().includes("date")
                                                        )
                                                        .map((sub) => ({
                                                            label: `${field.label} - ${sub.label}`,
                                                            key: `${field.label} - ${sub.label}`,
                                                        }));
                                                }

                                                if (field.label.toLowerCase().includes("date")) {
                                                    return [{ label: field.label, key: field.label }];
                                                }

                                                return [];
                                            })
                                        ).map(({ label, key }, idx) => (
                                            <li key={idx}>
                                                <button
                                                    className="dropdown-item"
                                                    type="button"
                                                    onClick={() => setSelectedDateRangeField(key)}
                                                >
                                                    {label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* From Date */}
                                <input
                                    type="date"
                                    className="form-control"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    style={{ flex: '1' }}
                                />

                                {/* To Date */}
                                <input
                                    type="date"
                                    className="form-control"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    style={{ flex: '1' }}
                                />

                                {/* Add Filter Button */}
                                <button
                                    className="btn btn-sm btn-primary"
                                    type="button"
                                    disabled={!(selectedDateRangeField && dateRange.from && dateRange.to)}
                                    onClick={() => {
                                        setFilters([
                                            ...filters,
                                            {
                                                field: selectedDateRangeField,
                                                value: `${dateRange.from} to ${dateRange.to}`,
                                            },
                                        ]);
                                        setSelectedDateRangeField("");
                                        setDateRange({ from: "", to: "" });
                                    }}
                                >
                                    <i className="fa-solid fa-filter me-2"></i>Add Filter
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

                <div className="modal fade" id="fieldSelectModal" tabIndex="-1" aria-labelledby="fieldSelectModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-scrollable modal-xl">
                        <div className="modal-content border-0 shadow-sm rounded-4">
                            <div className="modal-header text-white rounded-top-4">
                                <h5 className="modal-title" id="fieldSelectModalLabel">
                                    📝 Select Fields to Include in Report
                                </h5>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>

                            <div className="modal-body px-4">
                                {/* 🔘 Select All Checkbox */}
                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="selectAllFields"
                                        checked={selectedFields.length === allFieldLabels.length}
                                        onChange={() => {
                                            const allSelected = selectedFields.length === allFieldLabels.length;
                                            setSelectedFields(allSelected ? [] : allFieldLabels);
                                        }}
                                    />
                                    <label className="form-check-label fw-semibold" htmlFor="selectAllFields">
                                        Select All Fields
                                    </label>
                                </div>

                                <div className="row">
                                    {allFieldLabels.map((label, idx) => (
                                        <div className="col-12 col-md-4 mb-1" key={idx}>
                                            <label className="p-2 list-group-item d-flex align-items-center gap-2 border rounded shadow-sm">
                                                <input
                                                    className="form-check-input mt-0"
                                                    type="checkbox"
                                                    value={label}
                                                    checked={selectedFields.includes(label)}
                                                    onChange={() => toggleFieldSelection(label)}
                                                />
                                                <span className="fw-medium">{label}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer bg-light rounded-bottom-4">
                                <button type="button" className="btn" data-bs-dismiss="modal">
                                    Cancel
                                </button>

                                {/* 🔘 View Mode Selector */}
                                <div className="d-flex justify-content-end align-items-center mb-2">
                                    <label className="me-2 fw-semibold">View Mode:</label>
                                    <select
                                        className="form-select w-auto"
                                        value={viewMode}
                                        onChange={(e) => setViewMode(e.target.value)}
                                    >
                                        <option value="table">Table</option>
                                        <option value="grid">Grid</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    data-bs-dismiss="modal"
                                    onClick={() => {
                                        prepareFieldsToPrint();  // Sets correct keys
                                        setTimeout(() => handlePrint(), 100); // Give it time to re-render
                                    }}
                                >
                                    <i className="bi bi-printer me-1"></i> Print Selected
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loadingData ? (
                    <div className="text-center my-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) :
                    filteredCases.length > 0 ? (
                        filteredCases.map((caseItem, index) => {
                            const collapseId = `collapseCaseInfo-${index}`;
                            const caseDetails = caseItem.inputFields || {};
                            return (
                                <div key={index} className={`Case-Item ${openCollapses.includes(collapseId) ? 'active' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
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
                                            <div>{index + 1}</div>
                                            <div>{caseDetails['PC-DC Number']}</div>
                                            <div>
                                                <span style={{ fontWeight: 'bold' }}>DOC :</span>{" "}
                                                {caseDetails["Date Of Check"]
                                                    ? (() => {
                                                        const date = new Date(caseDetails["Date Of Check"]);
                                                        if (isNaN(date.getTime())) return caseDetails["Date Of Check"];
                                                        const day = String(date.getDate()).padStart(2, "0");
                                                        const month = String(date.getMonth() + 1).padStart(2, "0");
                                                        const year = date.getFullYear();
                                                        return `${day}-${month}-${year}`;
                                                    })()
                                                    : "Not filled"}
                                            </div>

                                            <div><span style={{ fontWeight: 'bold' }}></span> {caseDetails["Division"] || "Not filled"}</div>
                                            <div><span style={{ fontWeight: 'bold' }}></span> {caseDetails["Department"] || "Not filled"}</div>
                                            <div><span style={{ fontWeight: 'bold' }}>Name of CVI :</span> {caseDetails["Name Of Concern VI"] || "Not filled"}</div>
                                            <div><span style={{ fontWeight: 'bold' }}>Decision :</span> {caseDetails["SDGM Decision/Recommendation"] || "Not filled"}</div>
                                        </div>

                                        {
                                            filterType !== "All" &&
                                            (IsAdminLoggedIn || userRole.includes(filterType)) && (
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
                                                        aria-expanded={openCollapses.includes(collapseId)}
                                                        aria-controls={collapseId}
                                                        onClick={() => {
                                                            setOpenCollapses(prev =>
                                                                prev.includes(collapseId)
                                                                    ? prev.filter(id => id !== collapseId) // close if already open
                                                                    : [...prev, collapseId]               // open if not already open
                                                            );
                                                        }}

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
                                                {(() => {
                                                    const chargedEntry = formSchemas.find(form =>
                                                        form.inputFields.some(field => field.label === "No. of Charged Official")
                                                    );
                                                    const chargedSNo = chargedEntry?.SNo ?? Infinity;
                                                    const repeatCount = parseInt(caseDetails["No. of Charged Official"]) || 0;

                                                    const shouldIncludeForm = (form) => {
                                                        if (!Array.isArray(form.showIn)) return false;

                                                        if (filterType !== "DAR Action") {
                                                            return form.showIn.includes(filterType);
                                                        }

                                                        const showInSet = new Set(form.showIn.map(i => i.toLowerCase()));
                                                        const typeOfCheck = caseDetails["Type Of Check"]?.toLowerCase() ?? "";

                                                        if (showInSet.size === 1 && showInSet.has("dar action")) return true;

                                                        return showInSet.has("dar action") && showInSet.has(typeOfCheck);
                                                    };

                                                    const staticFields = formSchemas
                                                        .filter(form => form.SNo <= chargedSNo && shouldIncludeForm(form))
                                                        .flatMap((form, formIndex) =>
                                                            form.inputFields.map((inputField, index) =>
                                                                renderField(inputField, formIndex, index)
                                                            )
                                                        );

                                                    const repeatingGroups = Array.from({ length: repeatCount }).map((_, repeatIndex) => {
                                                        const groupFields = formSchemas
                                                            .filter(form => form.SNo > chargedSNo && shouldIncludeForm(form))
                                                            .flatMap((form, formIndex) =>
                                                                form.inputFields.map((inputField, index) =>
                                                                    renderField(inputField, formIndex, index, repeatIndex)
                                                                )
                                                            );

                                                        return {
                                                            index: repeatIndex,
                                                            fields: groupFields
                                                        };
                                                    });

                                                    return (
                                                        <>
                                                            {staticFields}

                                                            {repeatingGroups.map(({ index, fields }) => (
                                                                <div key={index} className="mb-3">
                                                                    <button
                                                                        className="btn btn-primary btn-sm text-start mb-2"
                                                                        onClick={() =>
                                                                            setGroupCollapseStates(prev => ({
                                                                                ...prev,
                                                                                [index]: !prev[index]
                                                                            }))
                                                                        }
                                                                    >
                                                                        {`Charged Official (${index + 1})`}{" "}
                                                                        <i className={`fa-solid ms-2 ${groupCollapseStates[index] ? 'fa-angles-up' : 'fa-angles-down'}`}></i>
                                                                    </button>

                                                                    {groupCollapseStates[index] && (
                                                                        <div className="row px-2">
                                                                            {fields}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </>
                                                    );


                                                    function renderField(inputField, formIndex, index, repeatIndex = null) {
                                                        const fieldKey = `${formIndex}-${index}${repeatIndex !== null ? `-${repeatIndex}` : ""}`;
                                                        const fieldLabel = repeatIndex !== null
                                                            ? `${inputField.label} ${repeatIndex + 1}`
                                                            : inputField.label;
                                                        const valueKey = repeatIndex !== null
                                                            ? `${inputField.label}_${repeatIndex}`
                                                            : inputField.label;

                                                        return (
                                                            <div
                                                                key={fieldKey}
                                                                className={inputField.type === "group" ? "col-12 mb-3" : "col-12 col-sm-4 col-md-3 mb-3"}
                                                            >
                                                                {inputField.type === "group" ? (
                                                                    <div>
                                                                        <p className="fw-bold p-2 rounded case-input-field-heading" style={{ fontSize: '17px' }}>{inputField.label}:</p>
                                                                        <div className="row">
                                                                            {inputField.fields.map((subField, idx) => {
                                                                                const subValueKey = repeatIndex !== null
                                                                                    ? `${subField.label}_${repeatIndex}`
                                                                                    : subField.label;
                                                                                return (
                                                                                    <div key={idx} className="col-12 col-sm-6 col-md-3 mb-2">
                                                                                        <label style={{ color: 'blue' }}>{subField.label}:</label>
                                                                                        <input
                                                                                            type={subField.label.toLowerCase().includes("date") ? "date" : "text"}
                                                                                            className="form-control"
                                                                                            placeholder={`Enter ${subField.label}`}
                                                                                            value={
                                                                                                editMode === caseItem._id
                                                                                                    ? updatedFields[subValueKey] ?? caseDetails[subValueKey] ?? ""
                                                                                                    : caseDetails[subValueKey] ?? ""
                                                                                            }
                                                                                            disabled={editMode !== caseItem._id}
                                                                                            onChange={(e) => {
                                                                                                if (editMode === caseItem._id) {
                                                                                                    setUpdatedFields((prev) => ({
                                                                                                        ...prev,
                                                                                                        [subValueKey]: e.target.value
                                                                                                    }));
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ) : inputField.type === "option" ? (
                                                                    <div>
                                                                        <p className="fw-bold" style={{ color: 'blue' }}>{fieldLabel}:</p>
                                                                        <select
                                                                            className="form-select"
                                                                            disabled={editMode !== caseItem._id}
                                                                            value={
                                                                                editMode === caseItem._id
                                                                                    ? updatedFields[valueKey] ?? caseDetails[valueKey] ?? ""
                                                                                    : caseDetails[valueKey] ?? ""
                                                                            }
                                                                            onChange={(e) => {
                                                                                if (editMode === caseItem._id) {
                                                                                    setUpdatedFields((prev) => ({
                                                                                        ...prev,
                                                                                        [valueKey]: e.target.value
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
                                                                        <p className="fw-bold" style={{ color: 'blue' }}>{fieldLabel}:</p>
                                                                        <input
                                                                            type={inputField.label.toLowerCase().includes("date") ? "date" : "text"}
                                                                            className="form-control"
                                                                            placeholder={`Enter ${inputField.label}`}
                                                                            value={
                                                                                editMode === caseItem._id
                                                                                    ? updatedFields[valueKey] ?? caseDetails[valueKey] ?? ""
                                                                                    : caseDetails[valueKey] ?? ""
                                                                            }
                                                                            disabled={editMode !== caseItem._id}
                                                                            onChange={(e) => {
                                                                                if (editMode === caseItem._id) {
                                                                                    setUpdatedFields((prev) => ({
                                                                                        ...prev,
                                                                                        [valueKey]: e.target.value
                                                                                    }));
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                })()}

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
                                                        <button
                                                            className="btn btn-sm btn-danger me-2"
                                                            onClick={() => closeCase(caseItem._id)}
                                                            disabled={closingCaseId === caseItem._id}
                                                        >
                                                            {closingCaseId === caseItem._id ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                                                                    Closing...
                                                                </>
                                                            ) : (
                                                                "Close Complete Case"
                                                            )}
                                                        </button>
                                                        {!caseItem.checkClose && (
                                                            <button
                                                                className="btn btn-sm btn-info me-2"
                                                                disabled={transferringCaseId === caseItem._id}
                                                                onClick={async () => {
                                                                    const confirmTransfer = window.confirm("Are you sure you want to transfer this case to DAR Action?");
                                                                    if (!confirmTransfer) return;

                                                                    setTransferringCaseId(caseItem._id);
                                                                    try {
                                                                        await axios.put(`https://vss-server.vercel.app/transfer-stage/${caseItem._id}`, {
                                                                            checkClose: true
                                                                        });
                                                                        setStatusMessage("Case transferred to DAR Action");
                                                                        setMessageType("success");
                                                                        fetchData();
                                                                    } catch (error) {
                                                                        console.error('Error transferring to DAR:', error);
                                                                        setStatusMessage("Transfer failed");
                                                                        setMessageType("danger");
                                                                    } finally {
                                                                        setTransferringCaseId(null);
                                                                    }
                                                                }}
                                                            >
                                                                {transferringCaseId === caseItem._id ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                        Transferring...
                                                                    </>
                                                                ) : (
                                                                    'Transfer to DAR Action'
                                                                )}
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
                        <div className="alert alert-warning text-center" role="alert">
                            No cases available.
                        </div>
                    )}
            </div>

            <div style={{
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                width: '1000px',
            }}
            >
                <ReportToPrint ref={componentRef} selectedCaseData={selectedCaseData} fieldsToPrint={fieldsToPrint} viewMode={viewMode} />
            </div>
            {statusMessage && (
                <div className={`toast-message alert alert-${messageType} alert-dismissible fade show`} role="alert">
                    {statusMessage}
                    <button type="button" className="btn-close" onClick={() => setStatusMessage("")}></button>
                </div>
            )}
        </div>
    );
}
