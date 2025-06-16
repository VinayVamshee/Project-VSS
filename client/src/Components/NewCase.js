import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function NewCase() {
    const navigate = useNavigate();
    const [formSchemas, setFormSchemas] = useState([]);
    const [formData, setFormData] = useState({});
    const [loadingForms, setLoadingForms] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const userToken = localStorage.getItem('userToken');
        const adminToken = localStorage.getItem('adminToken');

        if (!userToken && !adminToken) {
            navigate('/');
            return;
        }
    }, [navigate]);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await axios.get('https://vss-server.vercel.app/get-forms');
                const sortedForms = response.data.sort((a, b) => a.SNo - b.SNo);
                setFormSchemas(sortedForms);
            } catch (err) {
                console.error('Error fetching forms:', err);
            } finally {
                setLoadingForms(false);
            }
        };
        fetchForms();
    }, []);

    const handleChange = (label, value) => {
        setFormData((prev) => ({
            ...prev,
            [label]: value
        }));
    };

    const handleCaseSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            await axios.post('https://vss-server.vercel.app/post-case', {
                SNo: Date.now(),
                inputFields: formData
            });
            setFormData({});
            setMessage('✅ Case Registered Successfully!');
        } catch (err) {
            console.error(err);
            setMessage('❌ Failed to Register Case.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="AddNewSheet">
            {loadingForms ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status" />
                    <div className="mt-2">Loading form...</div>
                </div>
            ) : (
                <form onSubmit={handleCaseSubmit}>
                    <div className="container-fluid">
                        <div className="row">
                            {formSchemas.map((form, formIndex) =>
                                form.showIn?.includes("Case Registration") &&
                                form.inputFields.map((inputField, index) => (
                                    <div key={`${formIndex}-${index}`} className={inputField.type === 'group' ? 'col-12 mb-3' : 'col-12 col-sm-6 col-md-3 mb-3'}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <p className="fw-bold">{inputField.label}</p>
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
                                                            value={formData[subField.label] || ''}
                                                            onChange={(e) => handleChange(subField.label, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : inputField.type === 'option' ? (
                                            <select
                                                className="form-select"
                                                value={formData[inputField.label] || ''}
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
                                                value={formData[inputField.label] || ''}
                                                onChange={(e) => handleChange(inputField.label, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <button type="submit" className="btn btn-success btn-sm mt-3" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit'
                            )}
                        </button>

                        {message && (
                            <div className="alert alert-info mt-3 py-2">{message}</div>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}