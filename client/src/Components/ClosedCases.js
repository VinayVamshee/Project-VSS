import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from "xlsx";
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import ReportToPrint from './ReportToPrint';


export default function ClosedCases() {
    const navigate = useNavigate();
    const [CaseData, setCaseData] = useState([]);
    const [formSchemas, setFormSchemas] = useState([]);
    const [filterType, setFilterType] = useState("All");
    const [filters, setFilters] = useState([]);
    const [selectedField, setSelectedField] = useState();
    const [searchText, setSearchText] = useState("");

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

        if (userToken) {
            setIsUserLoggedIn(true);
            setUserRole(role || '');
            setAuthToken(userToken);
        } else {
            setIsUserLoggedIn(false);
            setUserRole('');
        }

        if (adminToken) {
            setIsAdminLoggedIn(true);
            setAuthToken(adminToken);
        } else {
            setIsAdminLoggedIn(false);
        }
    }, [navigate]);

    // eslint-disable-next-line
    const [loadingData, setLoadingData] = useState(true);

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
    // const closeCase = async (caseId) => {
    //     const confirmation = window.confirm(
    //         "Are you sure you want to close this case? This action cannot be undone."
    //     );

    //     if (confirmation) {
    //         try {
    //             await axios.put(`https://vss-server.vercel.app/close-case/${caseId}`);
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

    const filteredCases = CaseData.filter(caseItem => {
        const type = caseItem.inputFields?.["Type Of Check"];

        const isDARAction = filterType === "DAR Action";
        const isClosed = isDARAction
            ? caseItem.Closed === true && caseItem.checkClose === true
            : caseItem.Closed === true || caseItem.checkClose === true;

        if (!isClosed) return false;

        if (filterType !== "All" && !isDARAction && type !== filterType) return false;

        for (const { field, value } of filters) {
            let fieldValue = null;

            if (field.includes(" - ")) {
                const subFieldLabel = field.split(" - ")[1];
                fieldValue = caseItem.inputFields?.[subFieldLabel];
            } else {
                fieldValue = caseItem.inputFields?.[field];
            }

            if (!fieldValue) return false;

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
        documentTitle: `Closed Cases - ${filterType || 'All'} - Case Report - ${formattedDate} `,
    });

    const [viewMode, setViewMode] = useState("table");

    const [openCollapses, setOpenCollapses] = useState([]);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [selectedDateRangeField, setSelectedDateRangeField] = useState("");
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
                                    className="btn"
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

                {filteredCases.length > 0 ? (
                    filteredCases.map((caseItem, index) => {
                        const collapseId = `collapseCaseInfo-${index}`;
                        const caseDetails = caseItem.inputFields || {};
                        return (
                            <div key={index} className={`Case-Item ${openCollapses.includes(collapseId) ? 'active' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="Case-OverView">
                                    <div className="Base-Case">
                                        <i
                                            className={`fa-solid fa-circle-check fa-xl select-icon ${selectedCases.includes(caseItem._id) ? 'rotate' : ''}`}
                                            style={{
                                                color: (() => {
                                                    if (selectedCases.includes(caseItem._id)) return 'blue';
                                                    if (caseItem.Closed) return 'green';
                                                    if (caseItem.checkClose) return 'goldenrod';
                                                    return 'gray';
                                                })(),
                                                cursor: 'pointer',
                                                marginRight: '10px',
                                                transition: 'color 0.3s ease',
                                            }}
                                            onClick={(e) => {
                                                e.currentTarget.classList.add('rotate');
                                                setSelectedCases((prev) =>
                                                    prev.includes(caseItem._id)
                                                        ? prev.filter((id) => id !== caseItem._id)
                                                        : [...prev, caseItem._id]
                                                );
                                            }}
                                        ></i>
                                        <div>{index + 1}</div>
                                        {/* <div>S.No. {caseItem.SNo}</div> */}
                                        <div>Type of Check - {caseDetails["Type Of Check"] || "Not filled"}</div>
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
                                        <div>Department - {caseDetails["Department"] || "Not filled"}</div>
                                    </div>

                                    {/* ReOpen Case Button */}
                                    {
                                        filterType !== "All" &&
                                        (IsAdminLoggedIn || userRole.includes(filterType)) &&
                                        (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-info" style={{ whiteSpace: 'nowrap' }}
                                                    onClick={async () => {
                                                        const confirmation = window.confirm("Are you sure you want to reopen this case?");
                                                        if (confirmation) {
                                                            try {
                                                                await axios.put(`https://vss-server.vercel.app/reopen-case/${caseItem._id}`);
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
                                                    <i className="fa-solid fa-envelope-open-text fa-xl me-2"></i>Re-Open Case
                                                </button>
                                                <button className="btn" type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded={openCollapses.includes(collapseId)}
                                                    aria-controls={collapseId}
                                                    onClick={() => {
                                                        setOpenCollapses(prev =>
                                                            prev.includes(collapseId)
                                                                ? prev.filter(id => id !== collapseId) // close if already open
                                                                : [...prev, collapseId]               // open if not already open
                                                        );
                                                    }} >
                                                    <i className="fa-solid fa-square-caret-up fa-rotate-180 fa-lg"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    data-bs-toggle="modal"
                                                    data-bs-target={`#MoreInformation-${caseItem._id}`}
                                                    title="More Information"
                                                >
                                                    <i className="fas fa-info-circle fa-lg"></i>
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

                                                const shouldShowForm = (form) => {
                                                    if (!Array.isArray(form.showIn)) return false;

                                                    if (filterType === "DAR Action") {
                                                        if (form.showIn.length === 1 && form.showIn[0] === "DAR Action") return true;
                                                        return form.showIn.includes("DAR Action") && form.showIn.includes(caseDetails["Type Of Check"]);
                                                    }

                                                    return form.showIn.includes(filterType);
                                                };

                                                const renderInputField = (inputField, repeatIndex = null) => {
                                                    const labelSuffix = repeatIndex !== null ? ` ${repeatIndex + 1}` : "";
                                                    const valueKey = repeatIndex !== null ? `${inputField.label}_${repeatIndex}` : inputField.label;
                                                    const value = caseDetails[valueKey] ?? "";

                                                    return (
                                                        <div
                                                            key={valueKey}
                                                            className={inputField.type === "group" ? "col-12 mb-3" : "col-12 col-sm-6 col-md-3 mb-3"}
                                                        >
                                                            {inputField.type === "group" ? (
                                                                <div>
                                                                    <p className="fw-bold">{inputField.label}:</p>
                                                                    <div className="row">
                                                                        {inputField.fields.map((subField, idx) => {
                                                                            const subKey = repeatIndex !== null ? `${subField.label}_${repeatIndex}` : subField.label;
                                                                            const subValue = caseDetails[subKey] ?? "";

                                                                            return (
                                                                                <div key={idx} className="col-12 col-sm-6 col-md-3 mb-2">
                                                                                    <label>{subField.label}:</label>
                                                                                    <input
                                                                                        type={subField.label.toLowerCase().includes("date") ? "date" : "text"}
                                                                                        className="form-control"
                                                                                        value={subValue}
                                                                                        title={subValue}
                                                                                        disabled
                                                                                    />
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : inputField.type === "option" ? (
                                                                <div>
                                                                    <p className="fw-bold">{inputField.label + labelSuffix}:</p>
                                                                    <select className="form-select" value={value} disabled>
                                                                        <option value="">Select</option>
                                                                        {inputField.fields.map((opt, idx) => (
                                                                            <option key={idx} value={opt.label}>
                                                                                {opt.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : inputField.type === "link" ? (
                                                                <div>
                                                                    <p className="fw-bold text-primary">{inputField.label + labelSuffix}:</p>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={value}
                                                                            title={value}
                                                                            disabled
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-secondary"
                                                                            title="Open Link"
                                                                            onClick={() => value ? window.open(value, "_blank") : alert("No link provided")}
                                                                        >
                                                                            <i className="fas fa-external-link-alt"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <p className="fw-bold">{inputField.label + labelSuffix}:</p>
                                                                    <input
                                                                        type={inputField.label.toLowerCase().includes("date") ? "date" : "text"}
                                                                        className="form-control"
                                                                        value={value}
                                                                        title={value}
                                                                        disabled
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                };

                                                return (
                                                    <>
                                                        {/* Static Fields */}
                                                        {formSchemas
                                                            .filter(form => shouldShowForm(form) && form.SNo <= chargedSNo)
                                                            .flatMap(form => form.inputFields.map(inputField => renderInputField(inputField)))
                                                        }

                                                        {/* Repeating Groups */}
                                                        {Array.from({ length: repeatCount }).map((_, repeatIndex) => {
                                                            const isOpen = groupCollapseStates[repeatIndex];
                                                            const nameKey = `Name Of Charged Official_${repeatIndex}`;
                                                            const nameValue = caseDetails[nameKey] ?? "";

                                                            return (
                                                                <div key={`repeat-${repeatIndex}`} className="mb-3">
                                                                    <button
                                                                        className="btn btn-sm text-start px-2 rounded-3 shadow-sm btn-warning"
                                                                        onClick={() =>
                                                                            setGroupCollapseStates(prev => ({
                                                                                ...prev,
                                                                                [repeatIndex]: !prev[repeatIndex]
                                                                            }))
                                                                        }
                                                                    >
                                                                        <span className="fw-semibold">
                                                                            {nameValue?.trim() ? nameValue : `Charged Official (${repeatIndex + 1})`}
                                                                        </span>
                                                                        <i className={`fa-solid ms-2 ${isOpen ? 'fa-angles-up' : 'fa-angles-down'}`}></i>
                                                                    </button>

                                                                    {isOpen && (
                                                                        <div className="row p-3 mt-2 bg-light border rounded shadow-sm" style={{ animation: 'slideDownX 0.3s ease-in-out' }}>
                                                                            {formSchemas
                                                                                .filter(form => shouldShowForm(form) && form.SNo > chargedSNo)
                                                                                .flatMap(form =>
                                                                                    form.inputFields.map(inputField =>
                                                                                        renderInputField(inputField, repeatIndex)
                                                                                    )
                                                                                )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                    </>
                                                );
                                            })()}


                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )
                    :
                    null
                }
            </div>

            {filteredCases.map((caseItem, index) => {
                const caseDetails = caseItem.inputFields || {};
                const modalId = `MoreInformation-${caseItem._id}`;

                // Optional: helper to decide which fields to show
                const moreInfoForms = formSchemas.filter(form =>
                    Array.isArray(form.showIn) &&
                    form.showIn.some(s => s.toLowerCase() === "more information")
                );

                return (
                    <div
                        key={`modal-${caseItem._id}`}
                        className="modal fade"
                        id={modalId}
                        tabIndex="-1"
                        aria-labelledby={`${modalId}-label`}
                        aria-hidden="true"
                    >
                        <div className="modal-dialog modal-xl modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id={`${modalId}-label`}>
                                        More Information – {caseDetails["Registration No."] || ""}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        data-bs-dismiss="modal"
                                        aria-label="Close"
                                    ></button>
                                </div>
                                <div className="modal-body bg-light">
                                    <div className="container-fluid">
                                        <div className="row">
                                            {moreInfoForms.map((form, formIndex) =>
                                                form.inputFields.map((inputField, fieldIndex) => {
                                                    const value = caseDetails[inputField.label] || "";

                                                    return (
                                                        <div
                                                            key={`${formIndex}-${fieldIndex}`}
                                                            className="col-12 col-sm-6 col-md-4 mb-3"
                                                        >
                                                            <label className="fw-bold text-primary mb-1">
                                                                {inputField.label}
                                                            </label>

                                                            {inputField.type === "option" ? (
                                                                <select className="form-select" value={value} disabled>
                                                                    <option value="">Select</option>
                                                                    {inputField.fields.map((opt, idx) => (
                                                                        <option key={idx} value={opt.label}>
                                                                            {opt.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : inputField.type === "link" ? (
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={value}
                                                                        title={value}
                                                                        placeholder={`Enter ${inputField.label}`}
                                                                        disabled
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm link"
                                                                        title="Open Link"
                                                                        onClick={() =>
                                                                            value
                                                                                ? window.open(value, "_blank")
                                                                                : alert("No link provided")
                                                                        }
                                                                    >
                                                                        <i className="fas fa-external-link-alt"></i>
                                                                    </button>
                                                                </div>
                                                            ) : inputField.type === "group" ? (
                                                                <div className="row">
                                                                    {inputField.fields.map((subField, idx) => {
                                                                        const subVal = caseDetails[subField.label] || "";
                                                                        return (
                                                                            <div
                                                                                key={idx}
                                                                                className="col-12 col-sm-6 col-md-4 mb-2"
                                                                            >
                                                                                <label>{subField.label}</label>
                                                                                <input
                                                                                    type={
                                                                                        subField.label.toLowerCase().includes("date")
                                                                                            ? "date"
                                                                                            : "text"
                                                                                    }
                                                                                    className="form-control"
                                                                                    value={subVal}
                                                                                    title={subVal}
                                                                                    disabled
                                                                                />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type={
                                                                        inputField.label.toLowerCase().includes("date")
                                                                            ? "date"
                                                                            : "text"
                                                                    }
                                                                    className="form-control"
                                                                    value={value}
                                                                    title={value}
                                                                    placeholder={`Enter ${inputField.label}`}
                                                                    disabled
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            <div style={{
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                width: '1000px',
            }}>
                <ReportToPrint ref={componentRef} selectedCaseData={selectedCaseData} fieldsToPrint={fieldsToPrint} viewMode={viewMode} />
            </div>
        </div>
    );
}
