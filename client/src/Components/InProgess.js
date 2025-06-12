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

    const componentRef = useRef(null);
    const selectedCaseData = CaseData.filter(caseItem => selectedCases.includes(caseItem._id));
    const [selectedFields, setSelectedFields] = useState([]);
    const [allFieldLabels, setAllFieldLabels] = useState([]);

    useEffect(() => {
        const labels = new Set();
        selectedCaseData.forEach((caseItem) => {
            const fields = caseItem.inputFields || {};
            Object.keys(fields).forEach(label => labels.add(label));
        });

        const allLabelsArray = [...labels];

        setAllFieldLabels(prev =>
            JSON.stringify(prev) !== JSON.stringify(allLabelsArray) ? allLabelsArray : prev
        );
    }, [selectedCaseData]);

    const toggleFieldSelection = (label) => {
        setSelectedFields((prev) =>
            prev.includes(label)
                ? prev.filter((l) => l !== label)
                : [...prev, label]
        );
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: 'Selected Cases Report',
    });

    const [viewMode, setViewMode] = useState("table");

    const [openCollapses, setOpenCollapses] = useState([]);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [selectedDateRangeField, setSelectedDateRangeField] = useState("");

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
                                <div className="input-group mb-1">
                                    {/* Dropdown to select a date field */}
                                    <button
                                        className="btn btn-outline-secondary dropdown-toggle"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <i className="bi bi-calendar-range me-2"></i>
                                        {selectedDateRangeField || "Select date field"}
                                    </button>

                                    <ul className="dropdown-menu dropdown-menu-end">
                                        {formSchemas
                                            .flatMap((form) =>
                                                form.inputFields.flatMap((field) => {
                                                    if (field.type === "group") {
                                                        return field.fields
                                                            .filter((subField) =>
                                                                `${field.label} - ${subField.label}`.toLowerCase().includes("date")
                                                            )
                                                            .map((subField) => ({
                                                                label: `${field.label} - ${subField.label}`,
                                                                key: `${field.label} - ${subField.label}`,
                                                            }));
                                                    }

                                                    if (field.label.toLowerCase().includes("date")) {
                                                        return [{ label: field.label, key: field.label }];
                                                    }

                                                    return [];
                                                })
                                            )
                                            .map(({ label, key }, idx) => (
                                                <li key={idx}>
                                                    <button
                                                        className="dropdown-item"
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedDateRangeField(key);
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>

                                    {/* Date inputs shown only after field is selected */}
                                    {selectedDateRangeField && (
                                        <>
                                            <input
                                                type="date"
                                                className="form-control"
                                                placeholder="From date"
                                                value={dateRange.from}
                                                onChange={(e) =>
                                                    setDateRange({ ...dateRange, from: e.target.value })
                                                }
                                            />
                                            <input
                                                type="date"
                                                className="form-control"
                                                placeholder="To date"
                                                value={dateRange.to}
                                                onChange={(e) =>
                                                    setDateRange({ ...dateRange, to: e.target.value })
                                                }
                                            />
                                            <button
                                                className="btn btn-outline-primary"
                                                type="button"
                                                onClick={() => {
                                                    if (selectedDateRangeField && dateRange.from && dateRange.to) {
                                                        setFilters([
                                                            ...filters,
                                                            {
                                                                field: selectedDateRangeField,
                                                                value: `${dateRange.from} to ${dateRange.to}`,
                                                            },
                                                        ]);
                                                        setSelectedDateRangeField("");
                                                        setDateRange({ from: "", to: "" });
                                                    }
                                                }}
                                            >
                                                <i className="fa-solid fa-filter me-2"></i>Add Date Filter
                                            </button>
                                        </>
                                    )}
                                </div>

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
                                <button className="btn me-2" onClick={handleDownloadExcel}>
                                    <i className="fa-solid fa-file-excel me-2"></i> Download Excel
                                </button>
                                <button className="btn" data-bs-toggle="modal" data-bs-target="#fieldSelectModal">
                                    <i className="fa-solid fa-file-pdf me-2"></i> Download Report
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
                    <div className="modal-dialog modal-dialog-scrollable modal-lg">
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
                                        <div className="col-12 col-md-6 mb-1" key={idx}>
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
                                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
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
                                    onClick={() => handlePrint(viewMode)}
                                >
                                    <i className="bi bi-printer me-1"></i> Print Selected
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {filteredCases.length > 0 ? (
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


            <div style={{ display: "none" }}>
                <ReportToPrint ref={componentRef} selectedCaseData={selectedCaseData} selectedFields={selectedFields} viewMode={viewMode} />
            </div>
        </div>
    );
}
