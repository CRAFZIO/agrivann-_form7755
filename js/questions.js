const questionsTableBody = document.getElementById('questionsTableBody');
const questionForm = document.getElementById('questionForm');
const fieldTypeSelect = document.getElementById('fieldType');
const optionsDiv = document.getElementById('optionsDiv');

fieldTypeSelect.addEventListener('change', () => {
    if (fieldTypeSelect.value === 'select' || fieldTypeSelect.value === 'radio') {
        optionsDiv.classList.remove('d-none');
    } else {
        optionsDiv.classList.add('d-none');
    }
});

async function loadQuestions() {
    try {
        const response = await axiosInstance.get('/questions');
        const questions = response.data;
        
        questionsTableBody.innerHTML = '';
        questions.forEach(q => {
            const sectionBadge = q.section === 'core' ? 'bg-success' : 'bg-primary';
            questionsTableBody.innerHTML += `
                <tr>
                    <td data-label="Order">${q.order_index}</td>
                    <td data-label="Section"><span class="badge ${sectionBadge}">${q.section}</span></td>
                    <td data-label="Question">
                        <div class="fw-bold">${q.label_kn}</div>
                        <small class="text-muted">${q.field_name}</small>
                    </td>
                    <td data-label="Type"><span class="badge bg-info">${q.field_type}</span></td>
                    <td data-label="Required">${q.is_required ? '<span class="text-success">Yes</span>' : '<span class="text-muted">No</span>'}</td>
                    <td data-label="Actions">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editQuestion(${q.id})"><i class="fas fa-edit"></i></button>
                        ${q.section !== 'core' ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteQuestion(${q.id})"><i class="fas fa-trash"></i></button>` : ''}
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

async function saveQuestion() {
    const section = document.getElementById('questionSection').value || 'dynamic';
    const data = {
        label_kn: document.getElementById('labelKn').value,
        field_name: document.getElementById('fieldName').value,
        field_type: document.getElementById('fieldType').value,
        options: document.getElementById('fieldOptions').value.split(',').map(o => o.trim()).filter(o => o),
        is_required: document.getElementById('isRequired').checked,
        order_index: parseInt(document.getElementById('orderIndex').value) || 0,
        section: section
    };

    try {
        if (id) {
            await axiosInstance.put(`/questions/${id}`, data);
        } else {
            await axiosInstance.post('/questions', data);
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('questionModal'));
        modal.hide();
        questionForm.reset();
        document.getElementById('questionId').value = '';
        loadQuestions();
    } catch (error) {
        alert('Error saving question: ' + (error.response?.data?.msg || error.message));
    }
}

async function editQuestion(id) {
    try {
        const response = await axiosInstance.get('/questions');
        const q = response.data.find(item => item.id === id);
        if (!q) return;

        document.getElementById('questionId').value = q.id;
        document.getElementById('questionSection').value = q.section;
        document.getElementById('labelKn').value = q.label_kn;
        document.getElementById('fieldName').value = q.field_name;
        document.getElementById('fieldType').value = q.field_type;
        document.getElementById('fieldOptions').value = q.options.join(', ');
        document.getElementById('isRequired').checked = q.is_required;
        document.getElementById('orderIndex').value = q.order_index;

        // Make core fields read-only
        const isCore = q.section === 'core';
        document.getElementById('fieldName').readOnly = isCore;
        document.getElementById('fieldType').disabled = isCore;

        if (q.field_type === 'select' || q.field_type === 'radio') {
            optionsDiv.classList.remove('d-none');
        } else {
            optionsDiv.classList.add('d-none');
        }

        document.getElementById('modalTitle').innerText = 'Edit Question';
        const modal = new bootstrap.Modal(document.getElementById('questionModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching question:', error);
    }
}

async function deleteQuestion(id) {
    if (confirm('Are you sure you want to delete this question?')) {
        try {
            await axiosInstance.delete(`/questions/${id}`);
            loadQuestions();
        } catch (error) {
            alert('Error deleting question');
        }
    }
}

// Reset modal on hide
document.getElementById('questionModal').addEventListener('hidden.bs.modal', () => {
    questionForm.reset();
    document.getElementById('questionId').value = '';
    document.getElementById('questionSection').value = '';
    document.getElementById('fieldName').readOnly = false;
    document.getElementById('fieldType').disabled = false;
    document.getElementById('modalTitle').innerText = 'Add New Question';
    optionsDiv.classList.add('d-none');
});

document.addEventListener('DOMContentLoaded', loadQuestions);
