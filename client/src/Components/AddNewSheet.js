import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddNewSheet() {
    const [fields, setFields] = useState([]);
    const [SNo, setSNo] = useState('');
    const [label, setLabel] = useState('');
    const [type, setType] = useState('field');
    const [subFields, setSubFields] = useState([]);
    const [formSchemas, setFormSchemas] = useState([]); // To store fetched forms

    // Fetch all form schemas on component mount
    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await axios.get('http://localhost:3001/get-forms');
                const sortedForms = response.data.sort((a, b) => a.SNo - b.SNo); // Sort by SNo
                setFormSchemas(sortedForms);
            } catch (err) {
                console.error('Error fetching forms:', err);
            }
        };

        fetchForms();
    }, []);

    const handleSubmit = async () => {
        let updatedFields = [...fields];

        // If there's a label (i.e., user is typing a field but didn’t click "Add Field")
        if (label.trim()) {
            const newField = { label, type };
            if (type === 'group') {
                newField.fields = subFields.map(label => ({ label }));
            }
            updatedFields.push(newField);
        }

        try {
            const payload = {
                SNo: parseInt(SNo),
                inputFields: updatedFields,
            };

            const response = await axios.post('http://localhost:3001/add-form', payload);
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


    return (
        <div className="AddNewSheet">
            <button className="btn btn-sm btn-outline-primary mb-3" type="button" data-bs-toggle="collapse" data-bs-target="#CollapseInputField" aria-expanded="false" aria-controls="CollapseInputField">
                Add New Input Field
            </button>

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

                    {type === 'group' && (
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
                </div>
                <div className="mt-3">
                    <button className="btn btn-success" onClick={handleSubmit}>
                        Submit Form Label
                    </button>
                </div>
            </div>

            <form onSubmit={handleCaseSubmit}>
                <div className="container-fluid">
                    <div className="row">
                        {formSchemas.map((form, formIndex) =>
                            form.inputFields.map((inputField, index) => (
                                <div key={`${formIndex}-${index}`} className={inputField.type === 'group' ? 'col-12 mb-3' : 'col-12 col-sm-6 col-md-3 mb-3'}>
                                    {inputField.type === 'group' ? (
                                        <div>
                                            <p className='fw-bold'>{inputField.label}</p>
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
                                        </div>
                                    ) : inputField.type === 'option' ? (
                                        <div>
                                            <p className='fw-bold'>{inputField.label}:</p>
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
                                        </div>
                                    ) : (
                                        <div>
                                            <p className='fw-bold'>{inputField.label}:</p>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={`Enter ${inputField.label}`}
                                                onChange={(e) => handleChange(inputField.label, e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary mt-3">Submit</button>
                </div>
            </form>



        </div>
    );
}
