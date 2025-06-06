import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function NewCase() {
    const navigate = useNavigate();
    // eslint-disable-next-line 
    const [IsUserLoggedIn, setIsUserLoggedIn] = useState(false);
    // eslint-disable-next-line 
    const [IsAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    useEffect(() => {
        const userToken = localStorage.getItem('userToken');
        const adminToken = localStorage.getItem('adminToken');

        if (!userToken && !adminToken) {
            navigate('/');
            return;
        }

        if (userToken) {
            setIsUserLoggedIn(true);
        } else {
            setIsUserLoggedIn(false);
        }

        if (adminToken) {
            setIsAdminLoggedIn(true);
        } else {
            setIsAdminLoggedIn(false);
        }
    }, [navigate]);
    const [formSchemas, setFormSchemas] = useState([]);

    // Fetch forms once
    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await axios.get('https://vss-server.vercel.app/get-forms');
                const sortedForms = response.data.sort((a, b) => a.SNo - b.SNo);
                setFormSchemas(sortedForms);
            } catch (err) {
                console.error('Error fetching forms:', err);
            }
        };

        fetchForms();
    }, []);


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
            await axios.post('https://vss-server.vercel.app/post-case', {
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

            {/* Form Display & Input */}
            <form onSubmit={handleCaseSubmit}>
                <div className="container-fluid">
                    <div className="row">
                        {formSchemas.map((form, formIndex) =>
                            form.showIn?.includes("Case Registration") &&
                            form.inputFields.map((inputField, index) => (
                                <div key={`${formIndex}-${index}`} className={inputField.type === 'group' ? 'col-12 mb-3' : 'col-12 col-sm-6 col-md-3 mb-3'}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <p className='fw-bold'>{inputField.label}</p>
                                    </div>

                                    {inputField.type === 'group' ? (
                                        <div className="row">
                                            {inputField.fields.map((subField, idx) => (
                                                <div key={idx} className="col-12 col-sm-6 col-md-3 mb-2">
                                                    <label>{subField.label}:</label>
                                                    <input
                                                        type={subField.label.toLowerCase().includes("date") ? "date" : "text"}
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
                                            type={inputField.label.toLowerCase().includes("date") ? "date" : "text"}
                                            className="form-control"
                                            placeholder={`Enter ${inputField.label}`}
                                            onChange={(e) => handleChange(inputField.label, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <button type="submit" className="btn btn-sm btn-success mt-3">Submit</button>
                </div>
            </form>
        </div >
    );
}
