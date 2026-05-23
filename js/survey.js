document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('surveyForm');

    // Function to handle conditional sections
    const updateVisibility = (element) => {
        const targetId = element.dataset.target;
        if (!targetId) return;
        const target = document.querySelector(targetId);
        if (!target) return;

        let isYes = false;
        const val = element.value ? element.value.trim() : '';

        if (element.type === 'radio') {
            // For radios, check if any 'Yes' option in the group is checked
            const name = element.name;
            const checkedRadio = document.querySelector(`input[name="${name}"]:checked`);
            if (checkedRadio) {
                const checkedVal = checkedRadio.value.trim();
                isYes = (checkedVal === 'ಹೌದು' || checkedVal === 'Yes');
            }
        } else {
            // For selects
            isYes = (val === 'ಹೌದು' || val === 'Yes');
        }

        if (isYes) {
            target.classList.remove('d-none');
            target.querySelectorAll('input, select').forEach(el => {
                if (!el.classList.contains('other-trigger-input') && !el.hasAttribute('data-not-required') && el.type !== 'checkbox') {
                    el.required = true;
                }
            });
        } else {
            target.classList.add('d-none');
            target.querySelectorAll('input, select').forEach(el => {
                el.required = false;
                if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
                else if (el.tagName !== 'SELECT') el.value = '';
                else el.selectedIndex = 0;
            });
        }
    };

    // Initialize triggers
    document.querySelectorAll('.conditional-trigger').forEach(trigger => {
        trigger.addEventListener('change', () => updateVisibility(trigger));
    });

    // Handle "Other" inputs
    const updateOther = (trigger) => {
        const targetId = trigger.dataset.target;
        if (!targetId) return;
        const target = document.querySelector(targetId);
        if (!target) return;

        if (trigger.checked) {
            target.classList.remove('d-none');
            target.required = true;
            target.classList.add('other-trigger-input');
        } else {
            target.classList.add('d-none');
            target.required = false;
            target.value = '';
            target.classList.remove('other-trigger-input');
        }
    };

    document.querySelectorAll('.other-trigger').forEach(trigger => {
        trigger.addEventListener('change', () => updateOther(trigger));
    });

    // Dynamic Question Loading
    async function loadDynamicQuestions() {
        try {
            const res = await axios.get(`${CONFIG.API_BASE}/questions`);
            const questions = res.data;
            const container = document.getElementById('dynamicQuestionsContainer');
            if (!container) return;

            questions.forEach(q => {
                if (q.section === 'core') return; // Skip core questions as they are hardcoded
                const div = document.createElement('div');
                div.className = 'mb-4 glass-card p-3 dynamic-question';

                let inputHtml = '';
                const requiredAttr = q.is_required ? 'required' : '';
                const fieldName = `dyn_${q.field_name}`;

                if (q.field_type === 'text' || q.field_type === 'number') {
                    inputHtml = `<input type="${q.field_type}" name="${fieldName}" class="form-control" ${requiredAttr}>`;
                } else if (q.field_type === 'select') {
                    inputHtml = `<select name="${fieldName}" class="form-select" ${requiredAttr}>
                        <option value="">ಆಯ್ಕೆ ಮಾಡಿ (Select)</option>
                        ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>`;
                } else if (q.field_type === 'radio') {
                    inputHtml = `<div class="d-flex flex-wrap gap-3 mt-2">
                        ${q.options.map(opt => `
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="${fieldName}" value="${opt}" ${requiredAttr}>
                                <label class="form-check-label">${opt}</label>
                            </div>
                        `).join('')}
                    </div>`;
                }

                div.innerHTML = `
                    <label class="form-label fw-bold">${q.label_kn} ${q.is_required ? '*' : ''}</label>
                    ${inputHtml}
                    <div class="invalid-feedback">ದಯವಿಟ್ಟು ಈ ಕ್ಷೇತ್ರವನ್ನು ಭರ್ತಿ ಮಾಡಿ</div>
                `;
                container.appendChild(div);
            });
        } catch (error) {
            console.error('Error loading dynamic questions:', error);
        }
    }

    loadDynamicQuestions();

    // Form Submission Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let valid = true;
        const visibleRequired = form.querySelectorAll('input[required], select[required], textarea[required]');

        visibleRequired.forEach(input => {
            if (input.offsetParent !== null) {
                if (!input.checkValidity()) {
                    input.classList.add('is-invalid');
                    valid = false;
                } else {
                    input.classList.remove('is-invalid');
                }
            }
        });

        // Radio group validation
        const radioGroups = new Set();
        form.querySelectorAll('input[type="radio"][required]').forEach(r => {
            if (r.offsetParent !== null) radioGroups.add(r.name);
        });

        radioGroups.forEach(name => {
            const checked = form.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                form.querySelectorAll(`input[name="${name}"]`).forEach(r => r.classList.add('is-invalid'));
                valid = false;
            } else {
                form.querySelectorAll(`input[name="${name}"]`).forEach(r => r.classList.remove('is-invalid'));
            }
        });

        // Checkbox group validation (at least one must be checked)
        const checkboxGroups = new Set();
        form.querySelectorAll('input[type="checkbox"].checkbox-group').forEach(cb => {
            const group = cb.dataset.group;
            if (group && cb.offsetParent !== null) {
                checkboxGroups.add(group);
            }
        });

        checkboxGroups.forEach(groupName => {
            const groupCheckboxes = form.querySelectorAll(`input[type="checkbox"][name="${groupName}"]`);
            const anyChecked = Array.from(groupCheckboxes).some(cb => cb.checked);

            if (!anyChecked) {
                groupCheckboxes.forEach(cb => cb.classList.add('is-invalid'));
                const errorEl = document.getElementById(`error-${groupName}`);
                if (errorEl) {
                    errorEl.textContent = 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಆಯ್ಕೆ ಆಯ್ಕೆ ಮಾಡಿ';
                    errorEl.style.display = 'block';
                }
                valid = false;
            } else {
                groupCheckboxes.forEach(cb => cb.classList.remove('is-invalid'));
                const errorEl = document.getElementById(`error-${groupName}`);
                if (errorEl) {
                    errorEl.style.display = 'none';
                }
            }
        });

        if (!valid) {
            const firstError = form.querySelector('.is-invalid');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            alert('ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಕಡ್ಡಾಯ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ (Please fill all required fields)');
            return;
        }

        const formData = new FormData(form);
        const data = {};
        const dynamicResponses = {};

        const fieldsWithOther = [
            'education', 'crops_grown', 'main_problem', 'agri_problems', 'products_for_sale', 'animals_reared',
            'market_place', 'top_products', 'vehicle_type', 'desired_services', 'event_products', 'product_names'
        ];

        const processedKeys = new Set();
        formData.forEach((value, key) => {
            if (processedKeys.has(key)) return;
            processedKeys.add(key);

            if (key.startsWith('dyn_')) {
                const actualKey = key.replace('dyn_', '');
                dynamicResponses[actualKey] = value;
            } else if (fieldsWithOther.includes(key)) {
                let values = formData.getAll(key);
                const otherVal = formData.get(`${key}_other`);
                values = values.map(v => v === 'Other' ? (otherVal || 'Other') : v);
                data[key] = values.join(', ');
            } else if (key.endsWith('_other')) {
                return;
            } else {
                const values = formData.getAll(key);
                data[key] = values.length > 1 ? values.join(', ') : value;
            }
        });

        data['dynamic_responses'] = dynamicResponses;

        try {
            await axios.post(`${CONFIG.API_BASE}/farmers`, data);
            alert('ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಸಮೀಕ್ಷೆ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ.');
            form.reset();
            localStorage.removeItem('survey_draft');
            window.location.href = 'index.html';
        } catch (error) {
            console.error(error);
            alert('ಕ್ಷಮಿಸಿ, ಫಾರ್ಮ್ ಸಲ್ಲಿಸುವಲ್ಲಿ ದೋಷ ಉಂಟಾಗಿದೆ: ' + (error.response?.data?.msg || error.message));
        }
    });

    // Save draft
    form.addEventListener('input', () => {
        const data = {};
        new FormData(form).forEach((value, key) => {
            if (value && typeof value === 'string') data[key] = value;
        });
        localStorage.setItem('survey_draft', JSON.stringify(data));
    });

    // Run initial check to sync UI state
    document.querySelectorAll('.conditional-trigger').forEach(trigger => updateVisibility(trigger));
    document.querySelectorAll('.other-trigger').forEach(trigger => updateOther(trigger));
});
const data = {};
new FormData(form).forEach((value, key) => {
    if (value && typeof value === 'string') data[key] = value;
});
localStorage.setItem('survey_draft', JSON.stringify(data));
    });

// Run initial check to sync UI state
document.querySelectorAll('.conditional-trigger').forEach(trigger => updateVisibility(trigger));
document.querySelectorAll('.other-trigger').forEach(trigger => updateOther(trigger));
});
