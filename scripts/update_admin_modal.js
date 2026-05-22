const fs = require('fs');

let lines = fs.readFileSync('frontend/src/pages/AdminApp.vue', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('<div v-if="[\'document\', \'reservation\', \'report\', \'appointment\'].includes(activeModal)">'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('<h2><i class="fa-solid fa-user-tie"></i> Official Details</h2>'));

if (startIdx === -1 || endIdx === -1) {
    console.log("NOT FOUND", startIdx, endIdx);
    process.exit(1);
}

const before = lines.slice(0, startIdx);
const after = lines.slice(endIdx - 1); // keep the empty line or div

const newStr = `                <div v-if=\"['reservation', 'report', 'appointment'].includes(activeModal)\">
                    <h2><i class=\"fa-solid fa-eye\"></i> View Report</h2>
                    <p class=\"fine-print\">Review complete report details, then apply a status action.</p>

                    <div class=\"stack\" style=\"background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 3px solid var(--accent); margin: 15px 0;\">
                        <p v-for=\"detail in getRequestDetails(selectedItem)\" :key=\"detail.label\" v-show=\"detail.value\">
                            <strong>{{ detail.label }}:</strong> {{ detail.value }}
                        </p>
                    </div>

                    <div v-if=\"activeModal === 'report'\" style=\"margin: 12px 0 16px; display: grid; gap: 12px;\">
                        <div v-if=\"selectedItem.locationCoordinates?.latitude && selectedItem.locationCoordinates?.longitude\" style=\"padding: 12px; border: 1px solid #dce6e1; border-radius: 8px; background: #fcfefe;\">
                            <strong style=\"display: block; margin-bottom: 6px;\">Pinned Location</strong>
                            <p style=\"margin: 0 0 8px; color: #4f6b5d;\">{{ selectedItem.locationCoordinates.latitude }}, {{ selectedItem.locationCoordinates.longitude }}</p>
                            <iframe
                                :src=\"getReportMapEmbedUrl(selectedItem)\"
                                title=\"Report location map\"
                                style=\"width: 100%; height: 200px; border: 1px solid #dce6e1; border-radius: 8px; margin: 6px 0 10px;\"
                                loading=\"lazy\"
                                referrerpolicy=\"no-referrer-when-downgrade\"
                            ></iframe>
                            <a
                                :href=\"\`https://www.google.com/maps?q=\${selectedItem.locationCoordinates.latitude},\${selectedItem.locationCoordinates.longitude}\`\"
                                target=\"_blank\"
                                rel=\"noopener noreferrer\"
                                class=\"ghost-button\"
                                style=\"display: inline-flex; align-items: center; gap: 8px; text-decoration: none;\">
                                <i class=\"fa-solid fa-location-dot\"></i>
                                Open in Google Maps
                            </a>
                        </div>

                        <div v-if=\"Array.isArray(selectedItem.proofFiles) && selectedItem.proofFiles.length\" style=\"padding: 12px; border: 1px solid #dce6e1; border-radius: 8px; background: #fcfefe;\">
                            <strong style=\"display: block; margin-bottom: 10px;\">Proof Images</strong>
                            <div style=\"display: flex; gap: 10px; flex-wrap: wrap;\">
                                <a
                                    v-for=\"proofPath in selectedItem.proofFiles\"
                                    :key=\"proofPath\"
                                    :href=\"proofPath\"
                                    target=\"_blank\"
                                    rel=\"noopener noreferrer\"
                                    style=\"display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem;\">
                                    <i class=\"fa-regular fa-image\"></i>
                                    {{ proofPath.split('/').pop() }}
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Status display and action buttons -->
                    <div style=\"margin-top: 15px; margin-bottom: 20px;\">
                        <div style=\"margin-bottom: 10px; display: flex; align-items: center; gap: 12px;\">
                            <span style=\"font-weight: 600; color: #333;\">Status:</span>
                            <StatusBadge :status=\"selectedItem.status\" />
                        </div>

                        <StatusActionButtons
                            :entityType=\"activeModal === 'reservation' ? 'facilityReservation' : activeModal === 'appointment' ? 'appointment' : 'report'\"
                            :currentStatus=\"selectedItem.status\"
                            :loading=\"isSubmitting\"
                            @action-triggered=\"handleStatusAction\"
                        />
                    </div>
                </div>

                <div v-if=\"activeModal === 'document'\">
                    <h2><i class=\"fa-solid fa-file-lines\"></i> View Document Request</h2>
                    <p class=\"fine-print\">Review complete document request details and process the document generation.</p>
                    
                    <div style=\"display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr); gap: 20px; align-items: start; margin-top: 15px;\">
                        <!-- Left Pane: Details -->
                        <div style=\"display: grid; gap: 12px;\">
                            <div class=\"stack\" style=\"background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 3px solid var(--accent); margin: 0;\">
                                <p v-for=\"detail in getRequestDetails(selectedItem)\" :key=\"detail.label\" v-show=\"detail.value\">
                                    <strong>{{ detail.label }}:</strong> {{ detail.value }}
                                </p>
                            </div>

                            <div v-if=\"Array.isArray(selectedItem.proofFiles) && selectedItem.proofFiles.length\" style=\"padding: 12px; border: 1px solid #dce6e1; border-radius: 8px; background: #fcfefe;\">
                                <strong style=\"display: block; margin-bottom: 10px;\">Proof Images</strong>
                                <div style=\"display: flex; gap: 10px; flex-wrap: wrap;\">
                                    <a
                                        v-for=\"proofPath in selectedItem.proofFiles\"
                                        :key=\"proofPath\"
                                        :href=\"proofPath\"
                                        target=\"_blank\"
                                        rel=\"noopener noreferrer\"
                                        style=\"display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem;\">
                                        <i class=\"fa-regular fa-image\"></i>
                                        {{ proofPath.split('/').pop() }}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Right Pane: Management & Status -->
                        <div style=\"display: grid; gap: 12px;\">
                            <div v-if=\"isDocumentProcessing(selectedItem)\" style=\"padding:16px; border:1px solid #e6eef0; border-radius:8px; background:#fbfeff;\">
                                <h3 style=\"margin:0 0 12px 0;\">Document Management</h3>
                                <div class=\"stack\" style=\"gap: 12px;\">
                                    <label><span>Formal Purpose (admin)</span><input v-model=\"formalPurposeInput\" type=\"text\" style=\"width: 100%;\"></label>

                                    <div style=\"display:grid; grid-template-columns: 1fr; gap:12px;\">
                                        <label><span>Full name</span><input v-model=\"editableFields.FULL_NAME\" type=\"text\" style=\"width: 100%;\"></label>
                                        <label><span>Age</span><input v-model=\"editableFields.AGE\" type=\"text\" style=\"width: 100%;\"></label>
                                        <label><span>Barangay</span><input v-model=\"editableFields.BARANGAY\" type=\"text\" style=\"width: 100%;\"></label>
                                        <label><span>City</span><input v-model=\"editableFields.CITY\" type=\"text\" style=\"width: 100%;\"></label>
                                        <label><span>Province</span><input v-model=\"editableFields.PROVINCE\" type=\"text\" style=\"width: 100%;\"></label>
                                        <label><span>Purpose</span><input v-model=\"editableFields.PURPOSE\" type=\"text\" style=\"width: 100%;\"></label>
                                    </div>

                                    <div style=\"display:flex; gap:8px; flex-direction: column;\">
                                        <button type=\"button\" class=\"primary-button\" @click=\"saveDocumentEdits\" :disabled=\"isSubmitting\" style=\"width: 100%;\">
                                            <i class=\"fa-solid fa-save\"></i> {{ isSubmitting ? 'Saving...' : 'Save Edits' }}
                                        </button>
                                        <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 8px;\">
                                            <button type=\"button\" class=\"ghost-button\" @click=\"generatePreview(selectedItem)\" :disabled=\"previewLoading || isSubmitting\" style=\"width: 100%; justify-content: center;\">
                                                <i class=\"fa-solid fa-eye\"></i> Preview
                                            </button>
                                            <button type=\"button\" class=\"ghost-button\" @click=\"generateAndSavePdf(selectedItem)\" :disabled=\"previewLoading || isSubmitting\" style=\"width: 100%; justify-content: center;\">
                                                <i class=\"fa-solid fa-file-pdf\"></i> Save PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if=\"isDocumentRejected(selectedItem)\" style=\"padding:12px; border:1px solid #f1caca; border-radius:8px; background:#fff7f7; color:#7a1d1d;\">
                                This document request has been rejected.
                            </div>

                            <div v-if=\"isDocumentReady(selectedItem) || isDocumentCompleted(selectedItem)\" style=\"padding:12px; border:1px solid #dce6e1; border-radius:8px; background:#f7fbf9; color:#2d5f45;\">
                                PDF has already been generated and marked ready.
                            </div>

                            <!-- Status display and action buttons -->
                            <div style=\"padding:16px; border:1px solid #e1e8e4; border-radius:8px; background:#fafcfb;\">
                                <div style=\"margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px;\">
                                    <span style=\"font-weight: 600; color: #333;\">Status:</span>
                                    <StatusBadge :status=\"selectedItem.status\" />
                                </div>

                                <StatusActionButtons
                                    entityType=\"documentRequest\"
                                    :currentStatus=\"selectedItem.status\"
                                    :loading=\"isSubmitting\"
                                    @action-triggered=\"handleStatusAction\"
                                />
                            </div>
                        </div>
                    </div>
                </div>`;

const newLines = [...before, newStr, ...after];
fs.writeFileSync('frontend/src/pages/AdminApp.vue', newLines.join('\n'));
console.log('Done!');
