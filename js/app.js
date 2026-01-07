// App Logic
document.addEventListener('DOMContentLoaded', async () => {
    const contactList = document.getElementById('contact-list');
    const addBtn = document.getElementById('add-contact-btn');
    const modal = document.getElementById('contact-modal');
    const closeModal = document.getElementById('close-modal');
    const contactForm = document.getElementById('contact-form');
    const previewArea = document.getElementById('postcard-preview');

    let currentSelectedId = null;

    // --- DEBUG MODE CHECK ---
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
        document.body.classList.add('debug-mode');
        console.log('DEBUG MODE: Active');
        const badge = document.createElement('div');
        badge.style = 'position:fixed; bottom:10px; right:10px; background:rgba(255,0,0,0.8); color:white; padding:4px 8px; z-index:9999; font-weight:bold; border-radius:4px; font-size:12px; pointer-events:none;';
        badge.innerText = 'DEBUG MODE ON';
        document.body.appendChild(badge);
    }
    // -------------------------

    // Load and render contacts
    async function loadContacts() {
        const contacts = await getAllContacts();
        contactList.innerHTML = '';

        if (contacts.length === 0) {
            contactList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-sub);">連絡先がありません</div>';
            return;
        }

        contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = `address-item ${currentSelectedId === contact.id ? 'active' : ''}`;
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${contact.lastName} ${contact.firstName} ${contact.honorific || '様'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-sub);">${contact.address}</div>
                        <div style="font-size: 0.75rem; margin-top: 4px;">
                            ${contact.sent2025 ? '<span style="color: #e74c3c;">↑2025</span>' : ''}
                            ${contact.received2025 ? '<span style="color: #3498db;">↓2025</span>' : ''}
                            ${contact.sent2026 ? '<span style="color: #e74c3c;">↑2026</span>' : ''}
                            ${contact.received2026 ? '<span style="color: #3498db;">↓2026</span>' : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="edit-btn" data-id="${contact.id}" style="background: none; border: none; font-size: 0.8rem; color: var(--primary-color); padding: 4px;">✎</button>
                        <button class="delete-btn" data-id="${contact.id}" style="background: none; border: none; font-size: 0.8rem; color: #ff9999; padding: 4px;">✕</button>
                    </div>
                </div>
            `;
            item.onclick = (e) => {
                if (e.target.classList.contains('delete-btn')) {
                    const id = parseInt(e.target.dataset.id);
                    if (confirm('削除しますか？')) {
                        deleteContact(id).then(() => {
                            if (currentSelectedId === id) currentSelectedId = null;
                            loadContacts();
                        });
                    }
                    return;
                }
                if (e.target.classList.contains('edit-btn')) {
                    const id = parseInt(e.target.dataset.id);
                    contactForm.reset();
                    contactForm.dataset.id = id;
                    contactForm.elements['lastName'].value = contact.lastName || '';
                    contactForm.elements['firstName'].value = contact.firstName || '';
                    contactForm.elements['honorific'].value = contact.honorific || '様';
                    contactForm.elements['lastName2'].value = contact.lastName2 || '';
                    contactForm.elements['firstName2'].value = contact.firstName2 || '';
                    contactForm.elements['honorific2'].value = contact.honorific2 || '様';
                    contactForm.elements['lastName3'].value = contact.lastName3 || '';
                    contactForm.elements['firstName3'].value = contact.firstName3 || '';
                    contactForm.elements['honorific3'].value = contact.honorific3 || '様';
                    contactForm.elements['zip'].value = contact.zip || '';
                    contactForm.elements['address'].value = contact.address || '';
                    contactForm.elements['sent2025'].checked = contact.sent2025 || false;
                    contactForm.elements['received2025'].checked = contact.received2025 || false;
                    contactForm.elements['sent2026'].checked = contact.sent2026 || false;
                    contactForm.elements['received2026'].checked = contact.received2026 || false;
                    // Show joint name fields if data exists
                    if (contact.firstName2) document.getElementById('person2-fields').style.display = 'block';
                    if (contact.firstName3) document.getElementById('person3-fields').style.display = 'block';
                    modal.style.display = 'flex';
                    return;
                }
                selectContact(contact);
            };
            contactList.appendChild(item);
        });
    }

    function selectContact(contact) {
        currentSelectedId = contact.id;
        document.querySelectorAll('.address-item').forEach(el => el.classList.remove('active'));
        // Find the item and add active class (simple implementation)
        loadContacts();
        updatePreview(contact);
    }

    function updatePreview(contact) {
        const zipDigits = contact.zip.replace(/-/g, '').split('');
        const postalCodeArea = previewArea.querySelector('.postal-code-area');

        // Generate exactly 7 spans for recipient postal code
        postalCodeArea.innerHTML = zipDigits.map(d => `<span>${d}</span>`).join('');

        previewArea.querySelector('.address-main').innerText = contact.address;

        // Build name display with joint names
        const mainLastName = contact.lastName || '';
        // Build name display with joint names
        // Main recipient
        let nameHtml = `<div class="name-container" style="display: block; text-align: left; white-space: nowrap; line-height: 1.1;"><span class="name-text" style="font-size: 2.5rem; letter-spacing: 0.1em;">${mainLastName}&nbsp;${contact.firstName}</span><span style="font-size: 2.5rem; display: inline-block; height: 0.5em;"></span><span class="honorific" style="font-size: 1.5rem;">${contact.honorific || '様'}</span></div>`;

        if (contact.firstName2) {
            const ln2 = contact.lastName2;
            // Alignment logic: if no last name for joint, use hidden main last name as spacer
            const lnPartHtml = ln2 ? `${ln2}&nbsp;` : `<span style="font-size: 2.5rem; visibility: hidden;">${mainLastName}&nbsp;</span>`;
            nameHtml += `<div class="name-container" style="display: block; text-align: left; white-space: nowrap; line-height: 1.1;"><span class="name-text" style="font-size: 2.5rem; letter-spacing: 0.1em;">${lnPartHtml}${contact.firstName2}</span><span style="font-size: 2.5rem; display: inline-block; height: 0.5em;"></span><span class="honorific" style="font-size: 1.5rem;">${contact.honorific2 || '様'}</span></div>`;
        }
        if (contact.firstName3) {
            const ln3 = contact.lastName3;
            const lnPartHtml = ln3 ? `${ln3}&nbsp;` : `<span style="font-size: 2.5rem; visibility: hidden;">${mainLastName}&nbsp;</span>`;
            nameHtml += `<div class="name-container" style="display: block; text-align: left; white-space: nowrap; line-height: 1.1;"><span class="name-text" style="font-size: 2.5rem; letter-spacing: 0.1em;">${lnPartHtml}${contact.firstName3}</span><span style="font-size: 2.5rem; display: inline-block; height: 0.5em;"></span><span class="honorific" style="font-size: 1.5rem;">${contact.honorific3 || '様'}</span></div>`;
        }

        const nameArea = previewArea.querySelector('.name-area');
        nameArea.innerHTML = nameHtml;
    }

    // Modal logic
    addBtn.onclick = () => {
        contactForm.reset();
        delete contactForm.dataset.id;
        document.getElementById('person2-fields').style.display = 'none';
        document.getElementById('person3-fields').style.display = 'none';
        modal.style.display = 'flex';
    };

    closeModal.onclick = () => modal.style.display = 'none';

    contactForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const contact = {
            lastName: formData.get('lastName'),
            firstName: formData.get('firstName'),
            honorific: formData.get('honorific'),
            lastName2: formData.get('lastName2') || '',
            firstName2: formData.get('firstName2') || '',
            honorific2: formData.get('honorific2') || '',
            lastName3: formData.get('lastName3') || '',
            firstName3: formData.get('firstName3') || '',
            honorific3: formData.get('honorific3') || '',
            zip: formData.get('zip'),
            address: formData.get('address'),
            category: 'default',
            sent2025: contactForm.elements['sent2025'].checked,
            received2025: contactForm.elements['received2025'].checked,
            sent2026: contactForm.elements['sent2026'].checked,
            received2026: contactForm.elements['received2026'].checked
        };

        if (contactForm.dataset.id) {
            contact.id = parseInt(contactForm.dataset.id);
        }

        await saveContact(contact);
        modal.style.display = 'none';
        loadContacts();
    };

    // Joint name toggle
    let jointCount = 1;
    document.getElementById('add-joint-btn').onclick = () => {
        if (jointCount === 1) {
            document.getElementById('person2-fields').style.display = 'block';
            jointCount = 2;
        } else if (jointCount === 2) {
            document.getElementById('person3-fields').style.display = 'block';
            jointCount = 3;
            document.getElementById('add-joint-btn').style.display = 'none';
        }
    };

    // Settings Logic
    const settingsBtn = document.getElementById('settings-open-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const settingsForm = document.getElementById('settings-form');

    settingsBtn.onclick = async () => {
        const name = await db.settings.get('senderName');
        const zip = await db.settings.get('senderZip');
        const addr = await db.settings.get('senderAddress');
        settingsForm.elements['senderName'].value = name?.value || '';
        settingsForm.elements['senderZip'].value = zip?.value || '';
        settingsForm.elements['senderAddress'].value = addr?.value || '';
        settingsModal.style.display = 'flex';
    };

    closeSettings.onclick = () => settingsModal.style.display = 'none';

    settingsForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = settingsForm.elements['senderName'].value;
        const zip = settingsForm.elements['senderZip'].value;
        const addr = settingsForm.elements['senderAddress'].value;
        await db.settings.put({ key: 'senderName', value: name });
        await db.settings.put({ key: 'senderZip', value: zip });
        await db.settings.put({ key: 'senderAddress', value: addr });
        settingsModal.style.display = 'none';
        updateSenderUI();
    };

    async function updateSenderUI() {
        const name = await db.settings.get('senderName');
        const zip = await db.settings.get('senderZip');
        const addr = await db.settings.get('senderAddress');

        // Update sender postal code
        const senderPostalCode = previewArea.querySelector('.sender-postal-code');
        const zipValue = (zip?.value || '').replace(/-/g, '');
        // Generate exactly 7 spans if we have 7 digits
        senderPostalCode.innerHTML = zipValue.split('').map(d => `<span>${d}</span>`).join('');

        // Update sender address and name
        const senderArea = previewArea.querySelector('.sender-area');
        senderArea.innerHTML = `${(addr?.value || '住所未設定').replace(/\n/g, '<br>')}<br>${name?.value || '名前未設定'}`;
    }

    // Print logic
    document.getElementById('print-btn').onclick = () => {
        window.print();
    };

    // Initial load
    await loadContacts();

    // --- SENDER INITIALIZATION ---
    const initializeSender = async () => {
        // Default data (matches conf/sender_sample.json)
        const defaultData = {
            senderName: "山田 太郎",
            senderZip: "100-0001",
            senderAddress: "東京都千代田区千代田1-1\n千代田マンション101"
        };

        const tryLoad = async (filename) => {
            try {
                const response = await fetch(`${filename}?t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.senderName) await db.settings.put({ key: 'senderName', value: data.senderName });
                    if (data.senderZip) await db.settings.put({ key: 'senderZip', value: data.senderZip });
                    if (data.senderAddress) await db.settings.put({ key: 'senderAddress', value: data.senderAddress });

                    console.log(`Sender info initialized from ${filename}`);
                    if (document.body.classList.contains('debug-mode')) {
                        const msg = document.createElement('div');
                        msg.style = 'font-size: 10px; color: #fff; background: rgba(0,0,0,0.5); padding: 2px 5px; margin-top: 5px; border-radius: 2px;';
                        msg.innerText = `✓ ${filename} loaded`;
                        const badge = document.querySelector('div[style*="position:fixed; bottom:10px"]');
                        if (badge) badge.appendChild(msg);
                    }
                    return true;
                }
            } catch (e) {
                // console.error(`Error loading ${filename}:`, e);
                // Silent fail is expected in some environments
            }
            return false;
        };

        // 1. Try to load user's private config (conf/sender.json)
        // This might fail if using file:// protocol or if file doesn't exist
        const loadedPrivate = await tryLoad('conf/sender.json');

        // 2. If private config failed to load, check if DB is empty
        if (!loadedPrivate) {
            const currentName = await db.settings.get('senderName');

            // 3. If DB is empty, apply default sample data
            if (!currentName) {
                console.log('Applying default sender data (sample)');
                await db.settings.put({ key: 'senderName', value: defaultData.senderName });
                await db.settings.put({ key: 'senderZip', value: defaultData.senderZip });
                await db.settings.put({ key: 'senderAddress', value: defaultData.senderAddress });
            }
        }
    };
    await initializeSender();
    // ---------------------------------------

    await updateSenderUI();

    // CSV Export
    document.getElementById('export-btn').onclick = async () => {
        const contacts = await getAllContacts();
        if (contacts.length === 0) {
            alert('エクスポートする連絡先がありません。');
            return;
        }
        // CSV Header
        const header = ['姓', '名', '敬称', '姓2', '名2', '敬称2', '姓3', '名3', '敬称3', '郵便番号', '住所', 'カテゴリ', '2025送付', '2025受取', '2026送付', '2026受取'];
        const rows = contacts.map(c => [
            c.lastName || '',
            c.firstName || '',
            c.honorific || '様',
            c.lastName2 || '',
            c.firstName2 || '',
            c.honorific2 || '',
            c.lastName3 || '',
            c.firstName3 || '',
            c.honorific3 || '',
            c.zip || '',
            (c.address || '').replace(/\n/g, ' '),
            c.category || '',
            c.sent2025 ? '○' : '',
            c.received2025 ? '○' : '',
            c.sent2026 ? '○' : '',
            c.received2026 ? '○' : ''
        ]);

        // BOM + CSV content for Excel compatibility
        const bom = '\uFEFF';
        const csvContent = bom + [header, ...rows].map(row =>
            row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
        ).join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `住所録_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // CSV Import
    const fileInput = document.getElementById('csv-file-input');
    document.getElementById('import-btn').onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Try to read as UTF-8 first, if it fails or looks garbled, try Shift-JIS
        let text = await file.text();

        // Check if text looks garbled (common Shift-JIS to UTF-8 misread pattern)
        if (text.includes('ï¿½') || text.includes('�') || /[\x80-\x9F]/.test(text)) {
            // Re-read as Shift-JIS
            const buffer = await file.arrayBuffer();
            const decoder = new TextDecoder('shift-jis');
            text = decoder.decode(buffer);
        }

        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) return;

        const headerLine = lines[0];
        let startIndex = 0;
        let format = 'unknown';

        // Detect format from header
        if (headerLine.includes('フリガナ') && headerLine.includes('自宅')) {
            // Colario format: 姓,名,フリガナ,敬称,自宅7桁〒,住所１,住所２,...,連名1,...敬称(連名１),...連姓1...
            format = 'colario';
            startIndex = 1;
        } else if (headerLine.includes('姓') || headerLine.includes('名前') || headerLine.toLowerCase().includes('name')) {
            format = 'rakuraku';
            startIndex = 1;
        }

        let importedCount = 0;
        for (let i = startIndex; i < lines.length; i++) {
            const v = parseCSVLine(lines[i]);
            if (v.length < 3) continue;

            let contact = {};

            if (format === 'colario') {
                // Colario: 姓(0),名(1),フリガナ(2),敬称(3),〒(4),住所1(5),住所2(6),会社(7),部署(8),役職(9),連名1(10),連名2(11),連名3(12),連名4(13),連名5(14),敬称連1(15),敬称連2(16),敬称連3(17),敬称連4(18),敬称連5(19),連姓1(20),連姓2(21)...
                const zip = (v[4] || '').replace(/[^0-9]/g, '');
                const formattedZip = zip.length === 7 ? `${zip.slice(0, 3)}-${zip.slice(3)}` : zip;
                contact = {
                    lastName: v[0] ? v[0].replace(/^\(例\)/, '') : '',
                    firstName: v[1] || '',
                    honorific: v[3] || '様',
                    lastName2: v[20] || '', // 連姓1
                    firstName2: v[10] || '', // 連名1
                    honorific2: v[15] || '様', // 敬称(連名１)
                    lastName3: v[21] || '', // 連姓2
                    firstName3: v[11] || '', // 連名2
                    honorific3: v[16] || '様', // 敬称(連名２)
                    zip: formattedZip,
                    address: ((v[5] || '') + (v[6] || '')).trim(),
                    category: 'default'
                };
            } else if (v.length >= 10 && !v[2].includes('-') && v[9] && v[9].includes('-')) {
                // Our full format: 姓,名,敬称,姓2,名2,敬称2,姓3,名3,敬称3,郵便番号,住所,...
                contact = {
                    lastName: v[0] || '',
                    firstName: v[1] || '',
                    honorific: v[2] || '様',
                    lastName2: v[3] || '',
                    firstName2: v[4] || '',
                    honorific2: v[5] || '',
                    lastName3: v[6] || '',
                    firstName3: v[7] || '',
                    honorific3: v[8] || '',
                    zip: v[9] || '',
                    address: v[10] || '',
                    category: v[11] || 'default',
                    sent2025: v[12] === '○' || v[12] === 'true',
                    received2025: v[13] === '○' || v[13] === 'true',
                    sent2026: v[14] === '○' || v[14] === 'true',
                    received2026: v[15] === '○' || v[15] === 'true'
                };
            } else if (v.length >= 4 && v[0].length < 10 && v[1].length < 10) {
                // Simple split format: 姓,名,郵便番号,住所,カテゴリ
                contact = {
                    lastName: v[0],
                    firstName: v[1],
                    honorific: '様',
                    zip: v[2],
                    address: v[3],
                    category: v[4] || 'default'
                };
            } else {
                // Very old format: 名前,郵便番号,住所,カテゴリ
                const parts = v[0].split(/[\s　]+/);
                contact = {
                    lastName: parts[0] || '',
                    firstName: parts.slice(1).join(' ') || '',
                    honorific: '様',
                    zip: v[1],
                    address: v[2],
                    category: v[3] || 'default'
                };
            }

            await saveContact(contact);
            importedCount++;
        }

        fileInput.value = ''; // Reset
        await loadContacts();
        alert(`${importedCount} 件の連絡先をインポートしました。`);
    };

    // Simple CSV line parser (handles quoted fields)
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
});
