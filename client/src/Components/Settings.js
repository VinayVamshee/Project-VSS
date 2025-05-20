import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Settings() {
    const [fields, setFields] = useState([]);
    const [SNo, setSNo] = useState('');
    const [showIn, setShowIn] = useState([]);
    const [label, setLabel] = useState('');
    const [type, setType] = useState('field');
    const [subFields, setSubFields] = useState([]);
    const [formSchemas, setFormSchemas] = useState([]);
    const [edit, setEdit] = useState(false);

    // For editing
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormIndex, setEditFormIndex] = useState(null);
    const [editFieldIndex, setEditFieldIndex] = useState(null);
    const [editFieldData, setEditFieldData] = useState({ SNo: '', label: '', type: 'field', fields: [], showIn: [] });

    // Fetch forms once
    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await axios.get('http://localhost:3001/get-forms');
                const sortedForms = response.data.sort((a, b) => a.SNo - b.SNo);
                setFormSchemas(sortedForms);
            } catch (err) {
                console.error('Error fetching forms:', err);
            }
        };

        fetchForms();
    }, []);

    const handleSubmit = async () => {
        let updatedFields = [...fields];

        if (label.trim()) {
            const newField = { label, type };
            if (type === 'group' || type === 'option') {
                newField.fields = subFields.map(label => ({ label }));
            }
            updatedFields.push(newField);
        }

        try {
            const payload = {
                SNo: parseInt(SNo),
                inputFields: updatedFields,
                showIn: showIn
            };

            await axios.post('http://localhost:3001/add-form', payload);
            alert('Form submitted successfully!');
            setSNo('');
            setFields([]);
            setLabel('');
            setType('field');
            setSubFields([]);
        } catch (err) {
            alert('Error submitting form: ' + err.message);
        }
    };

    const [formData, setFormData] = useState({});

    const handleChange = (label, value) => {
        setFormData((prev) => ({
            ...prev,
            [label]: value
        }));
    };

    const handleCaseSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/post-case', {
                SNo: Date.now(),
                inputFields: formData
            });
            alert('Data saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save data.');
        }
    };

    // Open edit modal and fill data
    const openEditModal = (formIndex, fieldIndex) => {
        const form = formSchemas[formIndex];
        const fieldToEdit = form.inputFields[fieldIndex];

        setEditFormIndex(formIndex);
        setEditFieldIndex(fieldIndex);

        // Get SNo from inputField if exists, else from form level, else fallback
        const SNo = fieldToEdit.SNo !== undefined && fieldToEdit.SNo !== null
            ? fieldToEdit.SNo
            : (form.SNo !== undefined && form.SNo !== null
                ? form.SNo
                : (fieldIndex + 1)
            );

        setEditFieldData({
            SNo: SNo,
            label: fieldToEdit.label,
            type: fieldToEdit.type,
            fields: fieldToEdit.fields ? [...fieldToEdit.fields] : [],
            showIn: form.showIn || []
        });

        setEditModalOpen(true);
    };



    const handleEditFieldChange = (e) => {
        const { name, value } = e.target;
        setEditFieldData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubFieldChange = (index, value) => {
        const newSubFields = [...editFieldData.fields];
        newSubFields[index].label = value;
        setEditFieldData(prev => ({ ...prev, fields: newSubFields }));
    };

    const addEditSubField = () => {
        setEditFieldData(prev => ({
            ...prev,
            fields: [...prev.fields, { label: '' }]
        }));
    };

    const removeEditSubField = (index) => {
        const newSubFields = [...editFieldData.fields];
        newSubFields.splice(index, 1);
        setEditFieldData(prev => ({ ...prev, fields: newSubFields }));
    };

    const saveEditField = async () => {
        try {
            const updatedField = {
                SNo: editFieldData.SNo,
                label: editFieldData.label,
                type: editFieldData.type,
                fields: editFieldData.type === 'field' ? undefined : editFieldData.fields.filter(f => f.label.trim() !== ''),
                showIn: editFieldData.showIn || []
            };

            // Assume your backend expects form index and field index to identify what to update,
            // plus the updated field data
            await axios.post('http://localhost:3001/update-field', {
                formId: formSchemas[editFormIndex]._id,  // pass MongoDB id here
                fieldIndex: editFieldIndex,
                updatedField: updatedField,
            });


            // Update local state only after backend confirms
            const updatedFormSchemas = [...formSchemas];
            updatedFormSchemas[editFormIndex].inputFields[editFieldIndex] = updatedField;
            setFormSchemas(updatedFormSchemas);
            setEditModalOpen(false);
            alert('Field updated successfully');

        } catch (err) {
            console.error('Failed to update field:', err);
            alert('Error updating field');
        }
    };

    const handleDelete = async (formIndex, fieldIndex) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this field?');
        if (!confirmDelete) return; // If user cancels, do nothing

        try {
            const formId = formSchemas[formIndex]._id; // MongoDB form _id

            // Call backend DELETE endpoint with formId and fieldIndex in the URL
            await axios.delete(`http://localhost:3001/form/${formId}/field/${fieldIndex}`);

            // On success, update local state by removing the field locally
            const updatedForms = [...formSchemas];
            updatedForms[formIndex].inputFields.splice(fieldIndex, 1);
            setFormSchemas(updatedForms);

            alert('Field deleted successfully');
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete field');
        }
    };

    const handleCheckboxChange = (e) => {
        const value = e.target.value;
        setShowIn((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value]
        );
    };

    return (
        <div className="AddNewSheet">
            <button className='btn btn-sm btn-primary' style={{ width: 'fit-Content' }} onClick={() => setEdit(!edit)}>Edit</button>
            {/* Add New Input Field */}
            {
                edit && (
                    <button className="btn btn-sm btn-warning mb-3" style={{width:'fit-content'}} type="button" data-bs-toggle="collapse" data-bs-target="#CollapseInputField" aria-expanded="false" aria-controls="CollapseInputField">
                        Add New Input Field
                    </button>
                )
            }
            <div className="collapse" id="CollapseInputField">
                <div className="card card-body">
                    <div className="mb-3">
                        <label className="form-label">SNo</label>
                        <input className="form-control" type="number" value={SNo} onChange={(e) => setSNo(e.target.value)} />
                        <label className="form-label mt-2">Label</label>
                        <input type="text" className="form-control" placeholder="e.g., Personal Information" value={label} onChange={(e) => setLabel(e.target.value)} />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Type</label>
                        <select className="form-select" value={type} onChange={(e) => setType(e.target.value)} >
                            <option value="field">Individual Field</option>
                            <option value="group">Group of Fields</option>
                            <option value="option">Group of Options</option>
                        </select>
                    </div>

                    {(type === 'group' || type === 'option') && (
                        <div className="mb-3">
                            <label className="form-label">Sub-Fields</label>
                            <input type="text" className="form-control" placeholder="Press Enter to add sub-field"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.target.value.trim();
                                        if (val) {
                                            setSubFields([...subFields, val]);
                                            e.target.value = '';
                                        }
                                    }
                                }} />
                            <ul className="list-group mt-2">
                                {subFields.map((sf, i) => (
                                    <li key={i} className="list-group-item">{sf}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mb-3">
                        <label className="form-label">Show In</label>
                        <div className="d-flex gap-4 flex-wrap">

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value="Case Registration"
                                    checked={showIn.includes('Case Registration')}
                                    onChange={handleCheckboxChange}
                                    id="showin-CaseRegistration"
                                />
                                <label className="form-check-label" htmlFor="showin-CaseRegistration">
                                    Case Registration
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value="Preventive Check"
                                    checked={showIn.includes('Preventive Check')}
                                    onChange={handleCheckboxChange}
                                    id="showin-pc"
                                />
                                <label className="form-check-label" htmlFor="showin-pc">
                                    Preventive Check
                                </label>
                            </div>

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value="Decoy Check"
                                    checked={showIn.includes('Decoy Check')}
                                    onChange={handleCheckboxChange}
                                    id="showin-dc"
                                />
                                <label className="form-check-label" htmlFor="showin-dc">
                                    Decoy Check
                                </label>
                            </div>

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value="Complaint"
                                    checked={showIn.includes('Complaint')}
                                    onChange={handleCheckboxChange}
                                    id="showin-complaint"
                                />
                                <label className="form-check-label" htmlFor="showin-complaint">
                                    Complaint
                                </label>
                            </div>

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value="DAR Action"
                                    checked={showIn.includes('DAR Action')}
                                    onChange={handleCheckboxChange}
                                    id="showin-darAction"
                                />
                                <label className="form-check-label" htmlFor="showin-darAction">
                                    DAR Action
                                </label>
                            </div>
                        </div>
                    </div>
                </div>



                <div className="mt-3">
                    <button className="btn btn-success" onClick={handleSubmit}>
                        Submit Form Label
                    </button>
                </div>
            </div>

            {/* Form Display & Input */}
            <form onSubmit={handleCaseSubmit}>
                <div className="container-fluid">
                    <div className="row">
                        {formSchemas.map((form, formIndex) =>
                            // form.showIn.includes("Case Registration") &&
                            form.inputFields.map((inputField, index) => (
                                <div key={`${formIndex}-${index}`} className={inputField.type === 'group' ? 'col-12 mb-3' : 'col-12 col-sm-6 col-md-3 mb-3'}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <p className='fw-bold'>{inputField.label}</p>
                                        {
                                            edit && (
                                                <div>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEditModal(formIndex, index)}>Edit</button>
                                                    <button
                                                        type="button"
                                                        className="btn delete-button btn-sm btn-danger"
                                                        onClick={() => handleDelete(formIndex, index)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )
                                        }
                                    </div>

                                    {inputField.type === 'group' ? (
                                        <div className="row">
                                            {inputField.fields.map((subField, idx) => (
                                                <div key={idx} className="col-12 col-sm-6 col-md-3 mb-2">
                                                    <label>{subField.label}:</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder={`Enter ${subField.label}`}
                                                        onChange={(e) => handleChange(subField.label, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : inputField.type === 'option' ? (
                                        <select
                                            className="form-select"
                                            onChange={(e) => handleChange(inputField.label, e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            {inputField.fields.map((subField, idx) => (
                                                <option key={idx} value={subField.label}>
                                                    {subField.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={`Enter ${inputField.label}`}
                                            onChange={(e) => handleChange(inputField.label, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </form>

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Field</h5>
                                <button type="button" className="btn-close" aria-label="Close" onClick={() => setEditModalOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">SNo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="SNo"
                                        value={editFieldData.SNo}
                                        onChange={handleEditFieldChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Label</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="label"
                                        value={editFieldData.label}
                                        onChange={handleEditFieldChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        name="type"
                                        value={editFieldData.type}
                                        onChange={handleEditFieldChange}
                                    >
                                        <option value="field">Individual Field</option>
                                        <option value="group">Group of Fields</option>
                                        <option value="option">Group of Options</option>
                                    </select>
                                </div>

                                {(editFieldData.type === 'group' || editFieldData.type === 'option') && (
                                    <>
                                        <label>Sub-Fields</label>
                                        {editFieldData.fields.map((subField, i) => (
                                            <div key={i} className="input-group mb-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={subField.label}
                                                    onChange={(e) => handleEditSubFieldChange(i, e.target.value)}
                                                />
                                                <button type="button" className="btn btn-danger" onClick={() => removeEditSubField(i)}>Remove</button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-outline-primary" onClick={addEditSubField}>Add Sub-Field</button>
                                    </>
                                )}

                                <div className="mb-3">

                                    <label className="form-label">Show In</label>
                                    <div className="d-flex gap-4 flex-wrap">
                                        {['Case Registration', 'Preventive Check', 'Decoy Check', 'Complaint', 'DAR Action'].map((val) => (
                                            <div className="form-check" key={val}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    value={val}
                                                    checked={editFieldData.showIn?.includes(val)}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const updatedShowIn = editFieldData.showIn?.includes(value)
                                                            ? editFieldData.showIn.filter((item) => item !== value)
                                                            : [...(editFieldData.showIn || []), value];
                                                        setEditFieldData(prev => ({ ...prev, showIn: updatedShowIn }));
                                                    }}
                                                    id={`edit-showin-${val}`}
                                                />
                                                <label className="form-check-label" htmlFor={`edit-showin-${val}`}>
                                                    {val}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={saveEditField}>Save changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
