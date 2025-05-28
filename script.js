type="module"
        // Import jsPDF (requires type="module" for UMD build)
        const { jsPDF } = window.jspdf;

        // --- Global Utility Functions ---
        /**
         * Prevents default behavior and stops event propagation.
         * @param {Event} e - The event object.
         */
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // --- Global Tab Switching Logic ---
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        function switchTab(activeTabId) {
            tabContents.forEach(content => {
                if (content.id === activeTabId) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });

            tabButtons.forEach(button => {
                if (button.dataset.tab === activeTabId) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                switchTab(button.dataset.tab);
            });
        });

        // --- Image to PDF Converter Logic ---
        const imageInput = document.getElementById('image-input');
        const dropArea = document.getElementById('drop-area');
        const imagePreviewsContainer = document.getElementById('image-previews-container');
        const imagePreviews = document.getElementById('image-previews');
        const convertBtnImgPdf = document.getElementById('convert-btn-img-pdf');
        const downloadLinkImgPdf = document.getElementById('download-link-img-pdf');
        const loadingMessageImgPdf = document.getElementById('loading-message-img-pdf');
        const statusMessageImgPdf = document.getElementById('status-message-img-pdf');
        const clearImgPdfBtn = document.getElementById('clear-img-pdf-btn'); // Clear All button

        // New UI elements for Image to PDF options
        const pdfPageSizeSelect = document.getElementById('pdf-page-size');
        const pdfOrientationSelect = document.getElementById('pdf-orientation');
        const marginInputs = {
            top: document.getElementById('margin-top'),
            right: document.getElementById('margin-right'),
            bottom: document.getElementById('margin-bottom'),
            left: document.getElementById('margin-left')
        };


        let selectedImageFiles = []; // Stores File objects with dataURL, maintaining order

        // Drag and Drop Handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
        });

        dropArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleImageFiles(files);
        }

        // File Input Handler
        imageInput.addEventListener('change', (e) => {
            handleImageFiles(e.target.files);
        });

        function handleImageFiles(files) {
            loadingMessageImgPdf.classList.remove('hidden');
            statusMessageImgPdf.classList.add('hidden');
            downloadLinkImgPdf.classList.add('hidden');
            clearImgPdfBtn.classList.add('hidden'); // Hide clear button on new file selection

            const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

            if (newFiles.length === 0 && selectedImageFiles.length === 0) {
                showMessageImgPdf('error', 'Please upload image files (JPG, PNG, WebP, GIF, BMP).', true);
                loadingMessageImgPdf.classList.add('hidden');
                return;
            }

            let loadedCount = 0;
            const totalToLoad = newFiles.length;

            if (totalToLoad === 0 && selectedImageFiles.length > 0) {
                 loadingMessageImgPdf.classList.add('hidden');
                 return;
            } else if (totalToLoad === 0 && selectedImageFiles.length === 0) {
                loadingMessageImgPdf.classList.add('hidden');
                showMessageImgPdf('error', 'No valid image files were selected.', true);
                return;
            }

            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    const img = new Image();
                    img.src = reader.result;
                    img.onload = () => {
                        selectedImageFiles.push({ file: file, dataURL: reader.result, width: img.width, height: img.height });
                        loadedCount++;
                        if (loadedCount === totalToLoad) {
                            renderImagePreviews();
                            loadingMessageImgPdf.classList.add('hidden');
                            updateConvertButtonStateImgPdf();
                            showMessageImgPdf('success', `${newFiles.length} image(s) added successfully.`, true);
                        }
                    };
                    img.onerror = () => {
                        showMessageImgPdf('error', `Failed to load image: ${file.name}. It might be corrupted or an unsupported format.`, true);
                        loadedCount++;
                        if (loadedCount === totalToLoad) {
                            loadingMessageImgPdf.classList.add('hidden');
                            updateConvertButtonStateImgPdf();
                        }
                    }
                };
                reader.onerror = () => {
                    showMessageImgPdf('error', `Failed to read file: ${file.name}.`, true);
                    loadedCount++;
                    if (loadedCount === totalToLoad) {
                        loadingMessageImgPdf.classList.add('hidden');
                        updateConvertButtonStateImgPdf();
                    }
                };
            });
        }

        function renderImagePreviews() {
            imagePreviews.innerHTML = ''; // Clear existing previews
            if (selectedImageFiles.length > 0) {
                imagePreviewsContainer.classList.remove('hidden');
            } else {
                imagePreviewsContainer.classList.add('hidden');
            }

            selectedImageFiles.forEach((imgData, index) => {
                const previewItem = document.createElement('div');
                previewItem.classList.add('image-preview-item');
                previewItem.setAttribute('data-index', index);

                const img = document.createElement('img');
                img.src = imgData.dataURL;
                img.alt = `Preview of ${imgData.file.name}`;
                previewItem.appendChild(img);

                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-btn');
                deleteBtn.innerHTML = '&times;';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeImage(imgData.file.name);
                };
                previewItem.appendChild(deleteBtn);

                imagePreviews.appendChild(previewItem);
            });
        }

        function removeImage(fileName) {
            const initialCount = selectedImageFiles.length;
            selectedImageFiles = selectedImageFiles.filter(imgData => imgData.file.name !== fileName);
            if (selectedImageFiles.length < initialCount) {
                renderImagePreviews();
                updateConvertButtonStateImgPdf();
                showMessageImgPdf('info', `${fileName} removed.`, true);
            }
        }

        function updateConvertButtonStateImgPdf() {
            if (selectedImageFiles.length > 0) {
                convertBtnImgPdf.disabled = false;
                convertBtnImgPdf.classList.remove('hidden');
            } else {
                convertBtnImgPdf.disabled = true;
                convertBtnImgPdf.classList.add('hidden');
            }
        }

        function showMessageImgPdf(type, message, autoHide = false) {
            statusMessageImgPdf.classList.remove('hidden', 'info', 'success', 'error');
            statusMessageImgPdf.classList.add(type);
            statusMessageImgPdf.textContent = message;

            if (autoHide) {
                setTimeout(() => {
                    statusMessageImgPdf.classList.add('hidden');
                }, 5000);
            }
        }

        // Sortable.js for Drag & Drop Reordering (Image to PDF)
        new Sortable(imagePreviews, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                const [movedItem] = selectedImageFiles.splice(oldIndex, 1);
                selectedImageFiles.splice(newIndex, 0, movedItem);
            },
        });

        // Clear Image to PDF Section
        function clearImageToPdfSection() {
            selectedImageFiles = [];
            imageInput.value = ''; // Clear file input
            renderImagePreviews(); // Clear previews
            updateConvertButtonStateImgPdf();
            loadingMessageImgPdf.classList.add('hidden');
            statusMessageImgPdf.classList.add('hidden');
            downloadLinkImgPdf.classList.add('hidden');
            clearImgPdfBtn.classList.add('hidden'); // Hide clear button
            pdfPageSizeSelect.value = 'a4'; // Reset to default
            pdfOrientationSelect.value = 'p'; // Reset to default
            marginInputs.top.value = '10';
            marginInputs.right.value = '10';
            marginInputs.bottom.value = '10';
            marginInputs.left.value = '10';
            showMessageImgPdf('info', 'Image to PDF section cleared.', true);
        }
        clearImgPdfBtn.addEventListener('click', clearImageToPdfSection);


        // PDF Conversion Logic (Image to PDF)
        async function convertImagesToPdf() {
            if (selectedImageFiles.length === 0) {
                showMessageImgPdf('error', 'Please upload images first!', true);
                return;
            }

            convertBtnImgPdf.disabled = true;
            convertBtnImgPdf.textContent = 'Converting...';
            loadingMessageImgPdf.classList.remove('hidden');
            showMessageImgPdf('info', 'Converting images to PDF...', false);
            downloadLinkImgPdf.classList.add('hidden');
            clearImgPdfBtn.classList.add('hidden'); // Hide clear button during conversion

            try {
                const pageSize = pdfPageSizeSelect.value;
                const orientation = pdfOrientationSelect.value;
                const marginTop = parseFloat(marginInputs.top.value) || 0;
                const marginRight = parseFloat(marginInputs.right.value) || 0;
                const marginBottom = parseFloat(marginInputs.bottom.value) || 0;
                const marginLeft = parseFloat(marginInputs.left.value) || 0;

                const doc = new jsPDF(orientation, 'mm', pageSize);

                // Get page dimensions based on selected size and orientation
                let pageActualWidth = doc.internal.pageSize.getWidth();
                let pageActualHeight = doc.internal.pageSize.getHeight();

                // Calculate available content area
                const availableWidth = pageActualWidth - marginLeft - marginRight;
                const availableHeight = pageActualHeight - marginTop - marginBottom;

                for (let i = 0; i < selectedImageFiles.length; i++) {
                    const imgData = selectedImageFiles[i].dataURL;
                    const imgWidth = selectedImageFiles[i].width;
                    const imgHeight = selectedImageFiles[i].height;

                    const aspectRatio = imgWidth / imgHeight;
                    let imgPdfWidth = availableWidth;
                    let imgPdfHeight = availableWidth / aspectRatio;

                    if (imgPdfHeight > availableHeight) {
                        imgPdfHeight = availableHeight;
                        imgPdfWidth = availableHeight * aspectRatio;
                    }

                    if (i > 0) {
                        doc.addPage(pageSize, orientation); // Add page with selected size and orientation
                    }

                    // Center the image within the available content area
                    const xPos = marginLeft + (availableWidth - imgPdfWidth) / 2;
                    const yPos = marginTop + (availableHeight - imgPdfHeight) / 2;

                    const imgTypeMatch = imgData.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
                    const imgType = imgTypeMatch ? imgTypeMatch[1].toUpperCase() : 'JPEG';

                    doc.addImage(imgData, imgType, xPos, yPos, imgPdfWidth, imgPdfHeight);
                }

                const pdfBlob = doc.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);

                downloadLinkImgPdf.href = pdfUrl;
                downloadLinkImgPdf.classList.remove('hidden');
                clearImgPdfBtn.classList.remove('hidden'); // Show clear button after successful conversion
                showMessageImgPdf('success', 'PDF created successfully! Click "Download PDF".', false);

            } catch (error) {
                console.error("Error during PDF conversion:", error);
                showMessageImgPdf('error', `Error converting to PDF: ${error.message}. Please try again.`, false);
            } finally {
                convertBtnImgPdf.disabled = false;
                convertBtnImgPdf.textContent = 'Convert to PDF';
                loadingMessageImgPdf.classList.add('hidden');
            }
        }

        // --- PDF to Image Converter Logic (Requires PDF.js) ---
        // Set the workerSrc for pdf.js before using it
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        const pdfInput = document.getElementById('pdf-input');
        const pdfDropArea = document.getElementById('pdf-drop-area');
        const selectedPdfName = document.getElementById('selected-pdf-name');
        const convertPdfToImgBtn = document.getElementById('convert-pdf-to-img-btn');
        const outputFormatSelect = document.getElementById('output-format');
        const resolutionScaleSelect = document.getElementById('resolution-scale');
        const pageStartInput = document.getElementById('page-start');
        const pageEndInput = document.getElementById('page-end');
        const pdfImageOutput = document.getElementById('pdf-image-output');
        const downloadAllImagesBtn = document.getElementById('download-all-images-btn');
        const loadingMessagePdfImg = document.getElementById('loading-message-pdf-img');
        const statusMessagePdfImg = document.getElementById('status-message-pdf-img');
        const clearPdfImgBtn = document.getElementById('clear-pdf-img-btn'); // Clear All button


        let convertedImageBlobs = []; // Store blobs for ZIP download

        // PDF Drop Area Handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            pdfDropArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            pdfDropArea.addEventListener(eventName, () => pdfDropArea.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            pdfDropArea.addEventListener(eventName, () => pdfDropArea.classList.remove('highlight'), false);
        });

        pdfDropArea.addEventListener('drop', handlePdfDrop, false);

        function handlePdfDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                pdfInput.files = files; // Assign the dropped file to the input
                handlePdfFileSelection();
            } else {
                showMessagePdfImg('error', 'Please drop a PDF file.', true);
            }
        }

        pdfInput.addEventListener('change', handlePdfFileSelection);

        function handlePdfFileSelection() {
            const file = pdfInput.files[0];
            if (file) {
                selectedPdfName.textContent = file.name;
                updateConvertPdfToImgButtonState();
                pdfImageOutput.classList.add('hidden');
                downloadAllImagesBtn.classList.add('hidden');
                statusMessagePdfImg.classList.add('hidden');
                clearPdfImgBtn.classList.add('hidden'); // Hide clear button on new file selection
            } else {
                selectedPdfName.textContent = 'No file chosen';
                updateConvertPdfToImgButtonState();
            }
        }

        function updateConvertPdfToImgButtonState() {
            convertPdfToImgBtn.disabled = !pdfInput.files || pdfInput.files.length === 0;
        }

        function showMessagePdfImg(type, message, autoHide = false) {
            statusMessagePdfImg.classList.remove('hidden', 'info', 'success', 'error');
            statusMessagePdfImg.classList.add(type);
            statusMessagePdfImg.textContent = message;

            if (autoHide) {
                setTimeout(() => {
                    statusMessagePdfImg.classList.add('hidden');
                }, 5000);
            }
        }

        convertPdfToImgBtn.addEventListener('click', async () => {
            const file = pdfInput.files[0];
            if (!file) {
                showMessagePdfImg('error', 'Please select a PDF file.', true);
                return;
            }

            convertPdfToImgBtn.disabled = true;
            convertPdfToImgBtn.textContent = 'Converting...';
            loadingMessagePdfImg.classList.remove('hidden');
            showMessagePdfImg('info', 'Converting PDF to images...', false);
            pdfImageOutput.innerHTML = ''; // Clear previous images
            pdfImageOutput.classList.add('hidden');
            downloadAllImagesBtn.classList.add('hidden');
            clearPdfImgBtn.classList.add('hidden'); // Hide clear button during conversion
            convertedImageBlobs = []; // Reset blobs

            try {
                // Use pdfjsLib.getDocument directly
                const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;

                const outputFormat = outputFormatSelect.value;
                const resolutionScale = parseFloat(resolutionScaleSelect.value);
                const startPage = parseInt(pageStartInput.value) || 1;
                const endPage = parseInt(pageEndInput.value) || pdf.numPages;

                if (startPage > endPage || startPage < 1 || endPage > pdf.numPages) {
                    showMessagePdfImg('error', `Invalid page range. PDF has ${pdf.numPages} pages.`, true);
                    return;
                }

                for (let i = startPage; i <= endPage; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: resolutionScale });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport: viewport }).promise;

                    const dataUrl = canvas.toDataURL(`image/${outputFormat}`);
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${outputFormat}`));
                    convertedImageBlobs.push({ blob: blob, name: `page_${i}.${outputFormat}` });

                    const imgWrapper = document.createElement('div');
                    imgWrapper.classList.add('p-2', 'bg-gray-800', 'rounded-md', 'shadow', 'text-center');
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.alt = `Page ${i}`;
                    img.classList.add('max-w-full', 'h-auto', 'rounded-md');
                    const pageLabel = document.createElement('p');
                    pageLabel.classList.add('mt-2', 'text-gray-400', 'text-sm');
                    pageLabel.textContent = `Page ${i}`;

                    imgWrapper.appendChild(img);
                    imgWrapper.appendChild(pageLabel);
                    pdfImageOutput.appendChild(imgWrapper);
                }

                pdfImageOutput.classList.remove('hidden');
                downloadAllImagesBtn.classList.remove('hidden');
                clearPdfImgBtn.classList.remove('hidden'); // Show clear button after successful conversion
                showMessagePdfImg('success', `Converted ${convertedImageBlobs.length} page(s) to images.`, false);

            } catch (error) {
                console.error("Error during PDF to Image conversion:", error);
                showMessagePdfImg('error', `Error converting PDF to image: ${error.message}. Please try again.`, false);
            } finally {
                convertPdfToImgBtn.disabled = false;
                convertPdfToImgBtn.textContent = 'Convert PDF to Images';
                loadingMessagePdfImg.classList.add('hidden');
            }
        });

        // Download all images as ZIP
        downloadAllImagesBtn.addEventListener('click', async () => {
            if (convertedImageBlobs.length === 0) {
                showMessagePdfImg('error', 'No images to download. Please convert a PDF first.', true);
                return;
            }

            showMessagePdfImg('info', 'Preparing ZIP download...', false);
            downloadAllImagesBtn.disabled = true;
            downloadAllImagesBtn.textContent = 'Preparing ZIP...';

            try {
                const zip = new JSZip();
                convertedImageBlobs.forEach(item => {
                    zip.file(item.name, item.blob);
                });

                const zipBlob = await zip.generateAsync({ type: "blob" });
                const zipUrl = URL.createObjectURL(zipBlob);

                const a = document.createElement('a');
                a.href = zipUrl;
                a.download = 'pdf_pages.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(zipUrl); // Clean up the URL object

                showMessagePdfImg('success', 'Images downloaded as ZIP successfully!', false);
            } catch (error) {
                console.error("Error generating ZIP:", error);
                showMessagePdfImg('error', `Failed to create ZIP file: ${error.message}.`, false);
            } finally {
                downloadAllImagesBtn.disabled = false;
                downloadAllImagesBtn.textContent = 'Download All Images as ZIP';
            }
        });

        // Clear PDF to Image Section
        function clearPdfToImageSection() {
            pdfInput.value = ''; // Clear file input
            selectedPdfName.textContent = 'No file chosen';
            pdfImageOutput.innerHTML = ''; // Clear image previews
            pdfImageOutput.classList.add('hidden');
            downloadAllImagesBtn.classList.add('hidden');
            clearPdfImgBtn.classList.add('hidden'); // Hide clear button
            convertedImageBlobs = [];
            updateConvertPdfToImgButtonState();
            loadingMessagePdfImg.classList.add('hidden');
            statusMessagePdfImg.classList.add('hidden');
            outputFormatSelect.value = 'jpeg'; // Reset to default
            resolutionScaleSelect.value = '1.5'; // Reset to default
            pageStartInput.value = '';
            pageEndInput.value = '';
            showMessagePdfImg('info', 'PDF to Image section cleared.', true);
        }
        clearPdfImgBtn.addEventListener('click', clearPdfToImageSection);


        // --- Text to PDF Converter Logic ---
        const textToPdfInput = document.getElementById('text-to-pdf-input');
        const convertTextToPdfBtn = document.getElementById('convert-text-to-pdf-btn');
        const loadingMessageTextPdf = document.getElementById('loading-message-text-pdf');
        const statusMessageTextPdf = document.getElementById('status-message-text-pdf');
        const downloadTextPdfLink = document.getElementById('download-text-pdf-link');
        const clearTextPdfBtn = document.getElementById('clear-text-pdf-btn'); // Clear All button

        function showMessageTextPdf(type, message, autoHide = false) {
            statusMessageTextPdf.classList.remove('hidden', 'info', 'success', 'error');
            statusMessageTextPdf.classList.add(type);
            statusMessageTextPdf.textContent = message;

            if (autoHide) {
                setTimeout(() => {
                    statusMessageTextPdf.classList.add('hidden');
                }, 5000);
            }
        }

        convertTextToPdfBtn.addEventListener('click', async () => {
            const textContent = textToPdfInput.value.trim();

            if (textContent === '') {
                showMessageTextPdf('error', 'Please enter some text to convert!', true);
                return;
            }

            convertTextToPdfBtn.disabled = true;
            convertTextToPdfBtn.textContent = 'Converting...';
            loadingMessageTextPdf.classList.remove('hidden');
            statusMessageTextPdf.classList.add('hidden');
            downloadTextPdfLink.classList.add('hidden');
            clearTextPdfBtn.classList.add('hidden'); // Hide clear button during conversion

            // Create a temporary div to render the text with desired styles, then convert that div.
            const tempRenderDiv = document.createElement('div');
            tempRenderDiv.style.width = '700px'; // Approximate A4 width minus margins for text flow
            tempRenderDiv.style.padding = '30px'; // Add padding for content margins
            tempRenderDiv.style.fontSize = '14px'; // Increased font size for better readability
            tempRenderDiv.style.fontFamily = 'Inter, sans-serif'; // Use Inter font
            tempRenderDiv.style.color = '#000'; // Text color for the PDF (will be white background by default)
            tempRenderDiv.style.whiteSpace = 'pre-wrap'; // Preserves whitespace and line breaks
            tempRenderDiv.style.wordWrap = 'break-word'; // Ensures long words break
            tempRenderDiv.style.lineHeight = '1.6'; // Good line spacing
            tempRenderDiv.innerHTML = textContent.replace(/\n/g, '<br>'); // Convert newlines to <br> tags for HTML rendering

            document.body.appendChild(tempRenderDiv); // Temporarily add to DOM for html2canvas

            try {
                const canvas = await html2canvas(tempRenderDiv, {
                    scale: 2, // Increase scale for better resolution in PDF
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#FFFFFF' // Ensure white background for the text content
                });

                const { jsPDF } = window.jspdf;
                const imgData = canvas.toDataURL('image/jpeg', 1.0); // Use JPEG for smaller file size

                const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for units, 'a4' for page size

                const pdfPageWidth = pdf.internal.pageSize.getWidth(); // A4 width in mm
                const pdfPageHeight = pdf.internal.pageSize.getHeight(); // A4 height in mm

                const imgCanvasWidth = canvas.width;
                const imgCanvasHeight = canvas.height;

                // Calculate the aspect ratio to fit the image within the PDF page width (minus margins)
                const contentWidthMm = pdfPageWidth - (2 * 10); // A4 width minus 10mm margins on each side
                const imgPdfHeight = imgCanvasHeight * contentWidthMm / imgCanvasWidth;

                let heightLeft = imgPdfHeight;
                let position = 0; // Initial Y position for the image on the PDF page

                // Add the first page
                pdf.addImage(imgData, 'JPEG', 10, 10, contentWidthMm, imgPdfHeight); // X, Y, Width, Height
                heightLeft -= (pdfPageHeight - 2 * 10); // Subtract printable height for first page

                // Add subsequent pages if content overflows
                while (heightLeft > 0) {
                    position = - (imgPdfHeight - heightLeft); // Calculate Y position for the next slice
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 10, position + 10, contentWidthMm, imgPdfHeight); // Adjust Y for top margin
                    heightLeft -= (pdfPageHeight - 2 * 10);
                }

                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);

                downloadTextPdfLink.href = pdfUrl;
                downloadTextPdfLink.classList.remove('hidden');
                clearTextPdfBtn.classList.remove('hidden'); // Show clear button after successful conversion
                showMessageTextPdf('success', 'PDF created successfully! Click "Download Text PDF".', false);

            } catch (error) {
                console.error('Error generating PDF:', error);
                showMessageTextPdf('error', `Error generating PDF: ${error.message}. Please try again.`, false);
            } finally {
                document.body.removeChild(tempRenderDiv); // Clean up the temporary div
                convertTextToPdfBtn.disabled = false;
                convertTextToPdfBtn.textContent = 'Convert Text to PDF';
                loadingMessageTextPdf.classList.add('hidden');
            }
        });

        // Clear Text to PDF Section
        function clearTextToPdfSection() {
            textToPdfInput.value = '';
            loadingMessageTextPdf.classList.add('hidden');
            statusMessageTextPdf.classList.add('hidden');
            downloadTextPdfLink.classList.add('hidden');
            clearTextPdfBtn.classList.add('hidden'); // Hide clear button
            showMessageTextPdf('info', 'Text to PDF section cleared.', true);
        }
        clearTextPdfBtn.addEventListener('click', clearTextToPdfSection);


        // --- Resume Builder Logic ---
        const resumeTemplateSelection = document.getElementById('template-selection');
        const resumePreview = document.getElementById('resume-preview');
        const fontSelect = document.getElementById('font-select');
        const primaryColorInput = document.getElementById('primary-color');
        const sectionOrderList = document.getElementById('section-order-list');
        const generateResumePdfBtn = document.getElementById('generate-resume-pdf-btn');
        const downloadResumePdfLink = document.getElementById('download-resume-pdf-link');
        const loadingMessageResumePdf = document.getElementById('loading-message-resume-pdf');
        const statusMessageResumePdf = document.getElementById('status-message-resume-pdf');
        const clearResumeBtn = document.getElementById('clear-resume-btn'); // Clear All button

        // New constants for Bullet Point & List Styling
        const bulletTypeSelect = document.getElementById('bullet-type');
        const listLineHeightInput = document.getElementById('list-line-height');
        const listLineHeightValueSpan = document.getElementById('list-line-height-value');


        // Resume Data Model
        let resumeData = {
            personalInfo: {
                name: '',
                title: '',
                email: '',
                phone: '',
                linkedin: '',
                website: ''
            },
            summary: '',
            experience: [], // Array of { company, title, dates, description }
            education: [],   // Array of { degree, institution, dates, description }
            skills: '',      // Comma-separated string
            projects: [],    // Array of { title, dates, description, link }
            awards: []       // Array of { title, date, description }
        };

        // Current UI state
        let currentTemplate = 'modern'; // Default template
        let currentFont = 'Inter';
        let currentPrimaryColor = '#6366f1';
        let resumeSectionsOrder = ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'awards'];
        let pdfOutputType = 'multi-page';


        // --- Data Input Event Listeners ---
        const textInputs = ['name-input', 'title-input', 'email-input', 'phone-input', 'linkedin-input', 'website-input', 'summary-input', 'skills-input'];
        textInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', updateResumeDataAndPreview);
            }
        });

        // Dynamic section add/remove
        function setupDynamicSection(addBtnId, entriesContainerId, dataArrayName, templateFn) {
            document.getElementById(addBtnId).addEventListener('click', () => {
                resumeData[dataArrayName].push({}); // Add an empty entry
                renderDynamicSection(entriesContainerId, dataArrayName, templateFn);
                updateResumePreview();
            });
        }

        function renderDynamicSection(entriesContainerId, dataArrayName, templateFn) {
            const container = document.getElementById(entriesContainerId);
            container.innerHTML = ''; // Clear existing
            resumeData[dataArrayName].forEach((entry, index) => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('p-3', 'border', 'border-gray-600', 'rounded-md', 'bg-gray-700');
                entryDiv.innerHTML = templateFn(entry, index);

                // Add event listeners for inputs within this new entry
                entryDiv.querySelectorAll('input, textarea').forEach(input => {
                    input.addEventListener('input', (e) => {
                        const field = e.target.dataset.field;
                        resumeData[dataArrayName][index][field] = e.target.value;
                        updateResumePreview();
                    });
                });

                // Add remove button listener
                entryDiv.querySelector('.remove-entry-btn').addEventListener('click', () => {
                    resumeData[dataArrayName].splice(index, 1);
                    renderDynamicSection(entriesContainerId, dataArrayName, templateFn); // Re-render all to update indices
                    updateResumePreview();
                });

                container.appendChild(entryDiv);
            });
        }

        // Templates for dynamic input fields
        const experienceTemplate = (entry, index) => `
            <input type="text" data-field="title" value="${entry.title || ''}" placeholder="Job Title" class="form-input mb-2">
            <input type="text" data-field="company" value="${entry.company || ''}" placeholder="Company Name" class="form-input mb-2">
            <input type="text" data-field="dates" value="${entry.dates || ''}" placeholder="Start Date - End Date (e.g., 2020 - Present)" class="form-input mb-2">
            <textarea data-field="description" rows="3" placeholder="Responsibilities and achievements (use bullet points or line breaks)" class="form-input">${entry.description || ''}</textarea>
            <button class="remove-entry-btn btn-secondary mt-2 text-sm">Remove</button>
        `;
        const educationTemplate = (entry, index) => `
            <input type="text" data-field="degree" value="${entry.degree || ''}" placeholder="Degree/Major" class="form-input mb-2">
            <input type="text" data-field="institution" value="${entry.institution || ''}" placeholder="Institution Name" class="form-input mb-2">
            <input type="text" data-field="dates" value="${entry.dates || ''}" placeholder="Years (e.g., 2016 - 2020)" class="form-input mb-2">
            <textarea data-field="description" rows="2" placeholder="Relevant coursework, honors, GPA (optional)" class="form-input">${entry.description || ''}</textarea>
            <button class="remove-entry-btn btn-secondary mt-2 text-sm">Remove</button>
        `;
        const projectTemplate = (entry, index) => `
            <input type="text" data-field="title" value="${entry.title || ''}" placeholder="Project Title" class="form-input mb-2">
            <input type="text" data-field="dates" value="${entry.dates || ''}" placeholder="Dates (e.g., Jan 2023 - Mar 2023)" class="form-input mb-2">
            <input type="text" data-field="link" value="${entry.link || ''}" placeholder="Project Link (optional)" class="form-input mb-2">
            <textarea data-field="description" rows="3" placeholder="Description of your role and achievements" class="form-input">${entry.description || ''}</textarea>
            <button class="remove-entry-btn btn-secondary mt-2 text-sm">Remove</button>
        `;
        const awardTemplate = (entry, index) => `
            <input type="text" data-field="title" value="${entry.title || ''}" placeholder="Award/Certification Name" class="form-input mb-2">
            <input type="text" data-field="date" value="${entry.date || ''}" placeholder="Date (e.g., May 2024)" class="form-input mb-2">
            <textarea data-field="description" rows="2" placeholder="Description or significance" class="form-input">${entry.description || ''}</textarea>
            <button class="remove-entry-btn btn-secondary mt-2 text-sm">Remove</button>
        `;

        setupDynamicSection('add-experience-btn', 'experience-entries', 'experience', experienceTemplate);
        setupDynamicSection('add-education-btn', 'education-entries', 'education', educationTemplate);
        setupDynamicSection('add-project-btn', 'project-entries', 'projects', projectTemplate);
        setupDynamicSection('add-award-btn', 'award-entries', 'awards', awardTemplate);


        function updateResumeDataAndPreview(e) {
            const id = e.target.id;
            const value = e.target.value;

            if (id.startsWith('name-input')) resumeData.personalInfo.name = value;
            else if (id.startsWith('title-input')) resumeData.personalInfo.title = value;
            else if (id.startsWith('email-input')) resumeData.personalInfo.email = value;
            else if (id.startsWith('phone-input')) resumeData.personalInfo.phone = value;
            else if (id.startsWith('linkedin-input')) resumeData.personalInfo.linkedin = value;
            else if (id.startsWith('website-input')) resumeData.personalInfo.website = value;
            else if (id === 'summary-input') resumeData.summary = value;
            else if (id === 'skills-input') resumeData.skills = value;

            updateResumePreview();
        }

        // --- Customization Event Listeners ---
        resumeTemplateSelection.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.template-card');
            if (targetButton) {
                document.querySelectorAll('.template-card').forEach(btn => btn.classList.remove('active'));
                targetButton.classList.add('active');
                currentTemplate = targetButton.dataset.template;
                resumePreview.className = `resume-template ${currentTemplate}`; // Update class
                updateResumePreview();
            }
        });

        fontSelect.addEventListener('change', (e) => {
            currentFont = e.target.value;
            document.documentElement.style.setProperty('--font-family', `'${currentFont}', sans-serif`);
            updateResumePreview(); // Re-render to apply font to dynamic content
        });

        primaryColorInput.addEventListener('input', (e) => {
            currentPrimaryColor = e.target.value;
            document.documentElement.style.setProperty('--primary-color', currentPrimaryColor);
            updateResumePreview(); // Re-render to apply color to dynamic content
        });

        // Bullet Type Change Listener
        bulletTypeSelect.addEventListener('change', (e) => {
            const selectedBulletType = e.target.value;
            document.documentElement.style.setProperty('--bullet-type', selectedBulletType);
            updateResumePreview(); // Re-render to ensure styles are applied
        });

        // List Line Height Change Listener
        listLineHeightInput.addEventListener('input', (e) => {
            const lineHeight = e.target.value;
            listLineHeightValueSpan.textContent = `${lineHeight}x`; // Update the displayed value
            document.documentElement.style.setProperty('--list-line-height', lineHeight);
            updateResumePreview(); // Re-render to ensure styles are applied
        });


        // --- Section Reordering ---
        function renderSectionOrderList() {
            sectionOrderList.innerHTML = '';
            resumeSectionsOrder.forEach(sectionKey => {
                const li = document.createElement('li');
                li.classList.add('section-item');
                li.textContent = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/([A-Z])/g, ' $1'); // Nicely formatted name
                li.setAttribute('data-section', sectionKey);
                sectionOrderList.appendChild(li);
            });
        }

        new Sortable(sectionOrderList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                const [movedItem] = resumeSectionsOrder.splice(oldIndex, 1);
                resumeSectionsOrder.splice(newIndex, 0, movedItem);
                updateResumePreview(); // Re-render preview with new order
            },
        });

        // --- Resume Preview Rendering ---
        function updateResumePreview() {
            let htmlContent = '';

            // Common header for all templates
            const personal = resumeData.personalInfo;
            const contactInfo = `
                ${personal.email ? `<span>${personal.email}</span>` : ''}
                ${personal.phone ? `<span>${personal.phone}</span>` : ''}
                ${personal.linkedin ? `<span><a href="${personal.linkedin}" target="_blank" style="color: inherit; text-decoration: none;">LinkedIn</a></span>` : ''}
                ${personal.website ? `<span><a href="${personal.website}" target="_blank" style="color: inherit; text-decoration: none;">Website</a></span>` : ''}
            `.trim();

            if (currentTemplate === 'modern') {
                 htmlContent += `
                    <div class="header-section">
                        <h1>${personal.name || 'Your Name'}</h1>
                        <p>${personal.title || 'Professional Title'}</p>
                        <div class="contact-info">
                            ${contactInfo}
                        </div>
                    </div>
                `;
            } else if (currentTemplate === 'classic') {
                htmlContent += `
                    <div class="header-section">
                        <h1>${personal.name || 'Your Name'}</h1>
                        <p>${personal.title || 'Professional Title'}</p>
                        <div class="contact-info">
                            ${contactInfo}
                        </div>
                    </div>
                `;
            } else if (currentTemplate === 'minimal') {
                htmlContent += `
                    <div class="header-section">
                        <h1>${personal.name || 'Your Name'}</h1>
                        <p>${personal.title || 'Professional Title'}</p>
                        <div class="contact-info">
                             ${personal.email ? `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.67v8.58L12 21.43l10.5-4.18V8.67L12 5.5l-10.5 3.17Z" /><path d="M1.5 8.67 12 5.5l10.5 3.17m-10.5 12.76v-5.64" /><path d="M22.5 8.67V17.25a.75.75 0 0 1-.75.75H12" /><path d="M1.5 8.67v8.58a.75.75 0 0 0 .75.75H12m0 0v-5.64m0 0V5.5L1.5 8.67Z" /></svg>${personal.email}</span>` : ''}
                            ${personal.phone ? `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.85 1.404l.804 2.833 1.258.92c.181.133.204.347.106.529l-.956 1.764c-.16.295-.366.574-.608.822L5.857 18.25c-1.205 1.204-1.823 2.593-1.823 4.25H3a.75.75 0 0 1-.75-.75V4.5A3 3 0 0 1 1.5 4.5Zm11.838 9.526-.804 2.833-1.258-.92a.75.75 0 0 1-.106-.529l.956-1.764c.16-.295.366-.574.608-.822L17.143 5.75c1.205-1.204 1.823-2.593 1.823-4.25h1.275a.75.75 0 0 1 .75.75V19.5a3 3 0 0 1-3 3h-1.372a.75.75 0 0 1-.722-.533l-.804-2.833-1.258-.92a.75.75 0 0 1-.106-.529l.956-1.764c.16-.295.366-.574.608-.822L18.143 6.75c1.205-1.204 1.823-2.593 1.823-4.25h1.275a.75.75 0 0 1 .75.75V19.5a3 3 0 0 1-3 3h-1.372a.75.75 0 0 1-.722-.533Z" clip-rule="evenodd" /></svg>${personal.phone}</span>` : ''}
                            ${personal.linkedin ? `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M19.5 2.25A2.25 2.25 0 0 0 17.25 0H6.75A2.25 2.25 0 0 0 4.5 2.25v19.5A2.25 2.25 0 0 0 6.75 24h10.5A2.25 2.25 0 0 0 19.5 21.75V2.25Zm-9 11.25h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Zm0-3h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Zm0-3h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Zm6 7.5h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Zm0-3h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Zm0-3h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Z" clip-rule="evenodd" /><path d="M17.25 3H6.75a.75.75 0 0 0-.75.75v16.5a.75.75 0 0 0 .75.75h10.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75ZM15 7.5h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Zm0 3h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Zm0 3h-3.75a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 0 1.5Z" /></svg><a href="${personal.linkedin}" target="_blank" style="color: inherit; text-decoration: none;">LinkedIn</a></span>` : ''}
                            ${personal.website ? `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M7.747 1.5a.75.75 0 0 1 .75.75V4.5h6V2.25a.75.75 0 0 1 1.5 0V4.5h1.253a2.25 2.25 0 0 1 2.25 2.25v9.5A2.25 2.25 0 0 1 18.747 18H5.253a2.25 2.25 0 0 1-2.25-2.25v-9.5A2.25 2.25 0 0 1 5.253 4.5H6.75V2.25a.75.75 0 0 1 .75-.75Zm.75 3h6V2.25a.75.75 0 0 0-1.5 0V4.5H8.25V2.25a.75.75 0 0 0-1.5 0V4.5H5.253a.75.75 0 0 0-.75.75v9.5a.75.75 0 0 0 .75.75h13.494a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75H17.25V2.25a.75.75 0 0 0-1.5 0V4.5h-6V2.25a.75.75 0 0 0-1.5 0V4.5h-1.253a.75.75 0 0 0-.75.75v9.5a.75.75 0 0 0 .75.75H18.747a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75H5.253a2.25 2.25 0 0 1 2.25-2.25Z" clip-rule="evenodd" /><path d="M12 21a.75.75 0 0 1-.75-.75v-3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-.75.75Z" /></svg><a href="${personal.website}" target="_blank" style="color: inherit; text-decoration: none;">Website</a></span>` : ''}
                        </div>
                    </div>
                `;
            }


            // Loop through sections in the specified order
            resumeSectionsOrder.forEach(sectionKey => {
                const sectionData = resumeData[sectionKey];

                if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0) || (typeof sectionData === 'string' && !sectionData.trim())) {
                    return; // Skip empty sections
                }

                if (sectionKey === 'summary') {
                    htmlContent += `
                        <div class="section">
                            <h2>Summary</h2>
                            <div class="section-content">
                                <p>${sectionData.replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                    `;
                } else if (sectionKey === 'experience') {
                    htmlContent += `
                        <div class="section">
                            <h2>Experience</h2>
                            <div class="section-content">
                                ${sectionData.map(exp => `
                                    <h3>${exp.title || 'Job Title'} at ${exp.company || 'Company Name'}</h3>
                                    <p class="meta-info">${exp.dates || 'Dates of Employment'}</p>
                                    <ul>${exp.description ? exp.description.split('\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('') : ''}</ul>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else if (sectionKey === 'education') {
                    htmlContent += `
                        <div class="section">
                            <h2>Education</h2>
                            <div class="section-content">
                                ${sectionData.map(edu => `
                                    <h3>${edu.degree || 'Degree/Major'}</h3>
                                    <p class="meta-info">${edu.institution || 'Institution Name'} | ${edu.dates || 'Years'}</p>
                                    ${edu.description ? `<p>${edu.description}</p>` : ''}
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else if (sectionKey === 'skills') {
                    const skillsArray = sectionData.split(',').map(s => s.trim()).filter(s => s);
                    if (skillsArray.length > 0) {
                        htmlContent += `
                            <div class="section">
                                <h2>Skills</h2>
                                <div class="section-content">
                                    <ul class="skills-list">
                                        ${skillsArray.map(skill => `<li>${skill}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        `;
                    }
                } else if (sectionKey === 'projects') {
                    htmlContent += `
                        <div class="section">
                            <h2>Projects</h2>
                            <div class="section-content">
                                ${sectionData.map(proj => `
                                    <h3>${proj.title || 'Project Title'}</h3>
                                    <p class="meta-info">${proj.dates || 'Dates'} ${proj.link ? `| <a href="${proj.link}" target="_blank" style="color: inherit;">Link</a>` : ''}</p>
                                    <ul>${proj.description ? proj.description.split('\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('') : ''}</ul>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else if (sectionKey === 'awards') {
                    htmlContent += `
                        <div class="section">
                            <h2>Awards & Certifications</h2>
                            <div class="section-content">
                                ${sectionData.map(award => `
                                    <h3>${award.title || 'Award/Certification'}</h3>
                                    <p class="meta-info">${award.date || 'Date'}</p>
                                    ${award.description ? `<p>${award.description}</p>` : ''}
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            });

            resumePreview.innerHTML = htmlContent;
        }

        // --- Generate Resume PDF ---
        generateResumePdfBtn.addEventListener('click', async () => {
            generateResumePdfBtn.disabled = true;
            generateResumePdfBtn.textContent = 'Generating PDF...';
            loadingMessageResumePdf.classList.remove('hidden');
            statusMessageResumePdf.classList.add('hidden');
            downloadResumePdfLink.classList.add('hidden');
            clearResumeBtn.classList.add('hidden'); // Hide clear button during conversion

            // Store original styles before modification
            const originalPreviewPadding = resumePreview.style.padding;
            const originalPreviewFontSize = resumePreview.style.fontSize;
            const originalPreviewLineHeight = resumePreview.style.lineHeight;

            try {
                // Temporarily adjust for accurate html2canvas capture
                resumePreview.style.padding = '0px'; // Remove padding for capture to get raw content height
                resumePreview.style.display = 'block'; // Ensure it's visible for capture
                resumePreview.style.overflow = 'visible'; // Ensure all content is rendered

                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfPageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
                const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
                const pdfMargin = 10; // mm (for top, bottom, left, right)

                const contentWidthMm = pdfPageWidth - (2 * pdfMargin); // 190 mm
                const contentHeightMm = pdfPageHeight - (2 * pdfMargin); // 277 mm

                // Multi-Page Logic: Paginate content with consistent margins
                const canvas = await html2canvas(resumePreview, {
                    scale: 2, // High resolution capture
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#FFFFFF'
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const imgCanvasWidth = canvas.width;
                const imgCanvasHeight = canvas.height;

                const imgPdfHeight = imgCanvasHeight * (contentWidthMm / imgCanvasWidth); // Scaled height of *entire* captured content to fit contentWidthMm

                let currentContentY = 0; // Tracks Y position within the original captured canvas
                let currentPage = 1;

                while (currentContentY < imgCanvasHeight) {
                    if (currentPage > 1) {
                        pdf.addPage();
                    }

                    const sliceHeightInPdfContentArea = contentHeightMm;
                    const sliceHeightInCanvas = sliceHeightInPdfContentArea * (imgCanvasWidth / contentWidthMm); // Convert mm to canvas pixels

                    // Create a temporary canvas for the current slice
                    const tempSliceCanvas = document.createElement('canvas');
                    tempSliceCanvas.width = imgCanvasWidth;
                    tempSliceCanvas.height = Math.min(sliceHeightInCanvas, imgCanvasHeight - currentContentY);
                    const tempSliceContext = tempSliceCanvas.getContext('2d');

                    tempSliceContext.drawImage(
                        canvas,
                        0, currentContentY, // Source X, Y on the original captured canvas
                        imgCanvasWidth, tempSliceCanvas.height, // Source width, height
                        0, 0, // Destination X, Y on the temp slice canvas
                        tempSliceCanvas.width, tempSliceCanvas.height // Destination width, height
                    );

                    pdf.addImage(
                        tempSliceCanvas.toDataURL('image/jpeg', 1.0),
                        'JPEG',
                        pdfMargin, // X position on PDF page (left margin)
                        pdfMargin, // Y position on PDF page (top margin)
                        contentWidthMm, // Width on PDF page (content area width)
                        tempSliceCanvas.height * (contentWidthMm / imgCanvasWidth) // Height on PDF page (scaled to maintain aspect ratio)
                    );

                    currentContentY += sliceHeightInCanvas; // Move to the next slice in the original canvas
                    currentPage++;
                }
                showMessageResumePdf('success', 'Multi-page PDF generated successfully!', false);


                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);

                downloadResumePdfLink.href = pdfUrl;
                downloadResumePdfLink.classList.remove('hidden');
                clearResumeBtn.classList.remove('hidden'); // Show clear button after successful conversion

            } catch (error) {
                console.error("Error generating resume PDF:", error);
                showMessageResumePdf('error', `Failed to generate PDF: ${error.message}. Please check your content.`, false);
            } finally {
                // Restore original styles
                resumePreview.style.padding = originalPreviewPadding;
                resumePreview.style.fontSize = originalPreviewFontSize;
                resumePreview.style.lineHeight = originalPreviewLineHeight;

                generateResumePdfBtn.disabled = false;
                generateResumePdfBtn.textContent = 'Generate Resume PDF';
                loadingMessageResumePdf.classList.add('hidden');
            }
        });


        function showMessageResumePdf(type, message, autoHide = false) {
            statusMessageResumePdf.classList.remove('hidden', 'info', 'success', 'error');
            statusMessageResumePdf.classList.add(type);
            statusMessageResumePdf.textContent = message;

            if (autoHide) {
                setTimeout(() => {
                    statusMessageResumePdf.classList.add('hidden');
                }, 5000);
            }
        }

        // Clear Resume Builder Section
        function clearResumeBuilderSection() {
            // Reset resumeData to initial empty state
            resumeData = {
                personalInfo: {
                    name: '',
                    title: '',
                    email: '',
                    phone: '',
                    linkedin: '',
                    website: ''
                },
                summary: '',
                experience: [],
                education: [],
                skills: '',
                projects: [],
                awards: []
            };

            // Clear all input fields
            document.getElementById('name-input').value = '';
            document.getElementById('title-input').value = '';
            document.getElementById('email-input').value = '';
            document.getElementById('phone-input').value = '';
            document.getElementById('linkedin-input').value = '';
            document.getElementById('website-input').value = '';
            document.getElementById('summary-input').value = '';
            document.getElementById('skills-input').value = '';

            // Clear dynamic sections by re-rendering with empty data
            renderDynamicSection('experience-entries', 'experience', experienceTemplate);
            renderDynamicSection('education-entries', 'education', educationTemplate);
            renderDynamicSection('project-entries', 'projects', projectTemplate);
            renderDynamicSection('award-entries', 'awards', awardTemplate);

            // Reset customization options to defaults
            document.querySelectorAll('.template-card').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.template-card[data-template="modern"]').classList.add('active');
            currentTemplate = 'modern';

            fontSelect.value = 'Inter';
            document.documentElement.style.setProperty('--font-family', `'Inter', sans-serif`);

            primaryColorInput.value = '#6366f1';
            document.documentElement.style.setProperty('--primary-color', '#6366f1');

            bulletTypeSelect.value = 'disc';
            document.documentElement.style.setProperty('--bullet-type', 'disc');

            listLineHeightInput.value = '1.5';
            listLineHeightValueSpan.textContent = '1.5x';
            document.documentElement.style.setProperty('--list-line-height', '1.5');

            // Reset section order to default
            resumeSectionsOrder = ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'awards'];
            renderSectionOrderList();

            // Hide download link and messages
            downloadResumePdfLink.classList.add('hidden');
            loadingMessageResumePdf.classList.add('hidden');
            statusMessageResumePdf.classList.add('hidden');
            clearResumeBtn.classList.add('hidden'); // Hide clear button

            // Update preview to reflect cleared state
            updateResumePreview();
            showMessageResumePdf('info', 'Resume Builder section cleared.', true);
        }
        clearResumeBtn.addEventListener('click', clearResumeBuilderSection);


        // --- Initializations ---
        document.addEventListener('DOMContentLoaded', () => {
            // Set default tab to Resume Builder
            switchTab('resume-builder-section');

            // Initialize Image to PDF converter
            updateConvertButtonStateImgPdf();
            // Attach event listener for convertBtnImgPdf
            convertBtnImgPdf.addEventListener('click', convertImagesToPdf);


            // Initialize PDF to Image converter
            handlePdfFileSelection(); // Call initially to set "No file chosen"
            updateConvertPdfToImgButtonState();

            // Initialize Resume Builder
            renderSectionOrderList(); // Populate sortable list
            updateResumePreview();    // Render initial empty resume

            // Set initial values for input fields to trigger preview
            const inputs = document.querySelectorAll('#resume-builder-section .form-input');
            inputs.forEach(input => {
                // Manually trigger input event for initial state if pre-filled
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            });

            // Initial update for the list line height value display
            listLineHeightValueSpan.textContent = `${listLineHeightInput.value}x`;
        });
    
