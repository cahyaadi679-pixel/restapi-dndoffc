
let settings = {};
let allApiItems = [];

const categoryIcons = {
    'Downloader': 'folder',
    'Imagecreator': 'image',
    'Openai': 'smart_toy',
    'Random': 'shuffle',
    'Search': 'search',
    'Stalker': 'visibility',
    'Tools': 'build',
    'Orderkuota': 'paid',
    'AI Tools': 'psychology'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        settings = await loadSettings();
        setupUI();
        await loadAPIData();
        setupEventListeners();
        updateActiveUsers();
        
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage(error);
    } finally {
        // Always hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1000);
    }
}

async function loadSettings() {
    try {
        const response = await fetch('/settings');
        if (!response.ok) throw new Error('Settings not found');
        return await response.json();
    } catch (error) {
        return getDefaultSettings();
    }
}

function getDefaultSettings() {
    return {
        name: "REST API DND",
        creator: "REST API DND",
        description: "Interactive API documentation with real-time testing",
        categories: []
    };
}

function setupUI() {
    const titleApi = document.getElementById("titleApi");
    const descApi = document.getElementById("descApi");
    const footer = document.getElementById("footer");
    
    if (titleApi) titleApi.textContent = settings.name || "REST API DND";
    if (descApi) descApi.textContent = settings.description || "Interactive API documentation with real-time testing";
    if (footer) footer.textContent = `© ${new Date().getFullYear()} ${settings.creator || "DND"} - ${settings.name || "REST API DND"}`;
    
    const telegramLink = document.getElementById('telegramLink');
    const whatsappLink = document.getElementById('whatsappLink');
    const youtubeLink = document.getElementById('youtubeLink');
    const Information = document.getElementById("contactCustomerBtn");
    
    if (telegramLink) telegramLink.href = settings.linkTelegram || '#';
    if (telegramLink) telegramLink.href = settings.linkTelegram || '#';
    if (Information) Information.href = settings.linkWhatsapp || '#';
    if (youtubeLink) youtubeLink.href = settings.linkYoutube || '#';
}

function updateActiveUsers() {
    const el = document.getElementById('activeUsers');
    if (el) {
        const users = Math.floor(Math.random() * 5000) + 1000;
        el.textContent = users.toLocaleString();
    }
}

// Simpan data asli
let originalCategories = [];

async function loadAPIData() {
    console.log('Loading API data...');
    
    try {
        if (!settings.categories || settings.categories.length === 0) {
            console.log('No categories found, using default');
            settings.categories = [];
        }
        
        // Simpan data asli
        originalCategories = JSON.parse(JSON.stringify(settings.categories || []));
        console.log('Original categories saved:', originalCategories.length);
        
        // Render data awal
        renderAPIData(originalCategories);
        
    } catch (error) {
        console.error('Error loading API data:', error);
        // Tetap render dengan data kosong
        renderAPIData([]);
    }
}

function renderAPIData(categories) {
    console.log('Rendering API data:', categories.length, 'categories');
    
    const apiList = document.getElementById('apiList');
    if (!apiList) {
        console.error('apiList element not found!');
        return;
    }
    
    // Clear existing content
    apiList.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        apiList.innerHTML = '<div class="text-center py-8 text-gray-500">No API data available</div>';
        return;
    }
    
    let html = '';
    
    categories.forEach((category, catIndex) => {
        if (!category || !category.items) return;
        
        const icon = categoryIcons[category.name] || 'folder';
        const itemCount = category.items.length || 0;
        
        html += `
        <div class="category-group" data-category="${(category.name || '').toLowerCase()}">
            <div class="mb-2">
                <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <button onclick="toggleCategory(${catIndex})" class="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors duration-150">
                        <h2 class="font- flex items-center">
                            <span class="material-icons text-lg mr-3 text-gray-400">${icon}</span>
                            <span class="truncate max-w-xs text-sm">${category.name || 'Unnamed Category'}</span>
                            <span class="ml-2 text-xs text-slate-400">(${itemCount})</span>
                        </h2>
                        <span class="material-icons transition-transform duration-150" id="category-icon-${catIndex}">expand_less</span>
                    </button>
                    
                    <div id="category-${catIndex}">`;
        
        category.items.forEach((item, endpointIndex) => {
            if (!item) return;
            
            const method = item.method || 'GET';
            const pathParts = (item.path || '').split('?');
            const path = pathParts[0] || '';
            const itemName = item.name || 'Unnamed Endpoint';
            const itemDesc = item.desc || 'No description';
            
            const statusClass = 'status-ready';

            html += `
                        <div class="border-t border-gray-700 api-item" 
                             data-method="${method.toLowerCase()}"
                             data-path="${path}"
                             data-alias="${itemName}"
                             data-description="${itemDesc}"
                             data-category="${(category.name || '').toLowerCase()}">
                            <button onclick="toggleEndpoint(${catIndex}, ${endpointIndex})" class="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors duration-150">
                                <div class="flex items-center min-w-0 flex-1">
                                    <span class="inline-block px-3 py-1 text-xs text-white mr-3 flex-shrink-0 method-${method.toLowerCase()}">
                                        ${method}
                                    </span>
                                    <div class="flex flex-col min-w-0 flex-1">
                                        <span class="truncate max-w-[90%] font-mono text-sm" title="${path}">${path}</span>
                                        <div class="flex items-center">
                                            <span class="text-[13px] text-gray-400 truncate max-w-[90%]" title="${itemName}">${itemName}</span>
                                            <span class="ml-2 px-2 py-0.5 text-xs rounded-full ${statusClass}">${item.status || 'ready'}</span>
                                        </div>
                                    </div>
                                </div>
                                <span class="material-icons transition-transform duration-150 flex-shrink-0" id="endpoint-icon-${catIndex}-${endpointIndex}">expand_more</span>
                            </button>
                            
                            <div id="endpoint-${catIndex}-${endpointIndex}" class="hidden bg-gray-800 p-4 border-t border-gray-700 expand-transition">
                                <div class="mb-3">
                                    <div class="text-gray-400 text-[13px]">${itemDesc}</div>
                                </div>
                                
                                <div>
                                    <form id="form-${catIndex}-${endpointIndex}">
                                        <div class="mb-4 space-y-3" id="params-container-${catIndex}-${endpointIndex}">
                                            <!-- Parameters will be inserted here -->
                                        </div>
                                        
                                        <div class="mb-4">
                                            <div class="text-gray-300 font-medium text-[12px] mb-2 flex items-center">
                                                <span class="material-icons text-[14px] mr-1">link</span>
                                                REQUEST URL
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <div class="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded px-3 py-2 
            max-h-20 overflow-x-auto overflow-y-hidden">
    <code class="block text-[13px] text-slate-300 whitespace-nowrap" id="url-display-${catIndex}-${endpointIndex}">${window.location.origin}${item.path || ''}
    </code>
</div>
                                                <button type="button" onclick="copyUrl(${catIndex}, ${endpointIndex})" class="copy-btn bg-gray-700 border border-gray-600 hover:border-gray-500 max-h-20 text-slate-300 px-3 py-2 rounded text-[13px] font-medium transition-colors duration-150">
                                                    <i class="fas fa-copy"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="flex gap-2">
                                            <button type="button" onclick="executeRequest(event, ${catIndex}, ${endpointIndex}, '${method}', '${path}', 'application/json')" class="btn-gradient text-white px-6 py-2 text-xs font-medium transition-colors duration-150 flex items-center gap-1">
                                                <i class="fas fa-play"></i>
                                                Execute
                                            </button>
                                            <button type="button" onclick="clearResponse(${catIndex}, ${endpointIndex})" class="bg-gray-700 border border-gray-600 hover:border-gray-500 text-slate-300 px-6 py-2 text-xs font-medium transition-colors duration-150 flex items-center gap-1">
                                                <i class="fas fa-times"></i>
                                                Clear
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div id="response-${catIndex}-${endpointIndex}" class="hidden mt-4">
                                    <div class="text-gray-300 font-medium text-[12px] mb-2 flex items-center">
                                        <span class="material-icons text-[14px] mr-1">code</span>
                                        RESPONSE
                                    </div>
                                    <div class="bg-gray-900 border border-gray-700 rounded overflow-hidden">
                                        <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <span id="response-status-${catIndex}-${endpointIndex}" class="text-[12px] px-2 py-1 rounded bg-green-500/20 text-green-400">200 OK</span>
                                                <span id="response-time-${catIndex}-${endpointIndex}" class="text-[12px] text-gray-300">0ms</span>
                                            </div>
                                            <button onclick="copyResponse(${catIndex}, ${endpointIndex})" class="copy-btn text-gray-400 hover:text-white text-[13px]">
                                                <i class="fas fa-copy"></i>
                                            </button>
                                        </div>
                                        <div class="p-0 max-h-90 overflow-scroll">
                                            <div class="response-media-container" id="response-content-${catIndex}-${endpointIndex}"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
        });
        
        html += `</div></div></div>`;
    });
    
    apiList.innerHTML = html;
    
    // Initialize parameters for each endpoint
    setTimeout(() => {
        if (categories && categories.length > 0) {
            categories.forEach((category, catIndex) => {
                if (category && category.items) {
                    category.items.forEach((item, endpointIndex) => {
                        if (item) {
                            initializeEndpointParameters(catIndex, endpointIndex, item);
                        }
                    });
                }
            });
        }
    }, 100);
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) {
        console.warn('Search input not found');
        return;
    }
    
    searchInput.addEventListener('input', function() {
        handleSearch(this.value);
    });
}

function handleSearch(searchTerm) {
    const searchTermLower = (searchTerm || '').toLowerCase().trim();
    const noResults = document.getElementById('noResults');
    
    if (!searchTermLower) {
        // Kembalikan ke data asli
        console.log('Empty search, showing all');
        renderAPIData(originalCategories);
        if (noResults) noResults.classList.add('hidden');
        return;
    }
    
    console.log('Searching for:', searchTermLower);
    
    // Filter data
    const filteredData = [];
    
    originalCategories.forEach(category => {
        if (!category || !category.items) return;
        
        const filteredItems = [];
        
        category.items.forEach(item => {
            if (!item) return;
            
            const matches = 
                (item.name || '').toLowerCase().includes(searchTermLower) ||
                (item.desc || '').toLowerCase().includes(searchTermLower) ||
                (item.path || '').toLowerCase().includes(searchTermLower) ||
                (item.method || '').toLowerCase().includes(searchTermLower) ||
                (category.name || '').toLowerCase().includes(searchTermLower);
            
            if (matches) {
                filteredItems.push(item);
            }
        });
        
        if (filteredItems.length > 0) {
            filteredData.push({
                ...category,
                items: filteredItems
            });
        }
    });
    
    console.log('Filtered results:', filteredData.length, 'categories');
    
    if (filteredData.length === 0) {
        const apiList = document.getElementById('apiList');
        if (apiList) apiList.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
    } else {
        renderAPIData(filteredData);
        if (noResults) noResults.classList.add('hidden');
    }
}

function initializeEndpointParameters(catIndex, endpointIndex, item) {
    const paramsContainer = document.getElementById(`params-container-${catIndex}-${endpointIndex}`);
    if (!paramsContainer) return;
    
    const params = extractParameters(item.path);
    
    if (params.length === 0) {
        paramsContainer.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-check text-green-500 text-xs mb-1"></i>
                <p class="text-xxs text-gray-400">No parameters required</p>
            </div>
        `;
        return;
    }
    
    let paramsHtml = '';
    params.forEach(param => {
        const isRequired = param.required;
        paramsHtml += `<div>
            <div class="flex items-center justify-between mb-1">
                <label class="block text-[13px] font-medium text-slate-400">${param.name} ${isRequired ? '<span class="text-red-500">*</span>' : ''}</label>
                <span class="text-[13px] text-gray-500">${param.type}</span>
            </div>
            <input 
                type="text" 
                name="${param.name}" 
                class="w-full px-3 py-2 border border-gray-600 text-[13px] focus:outline-none focus:border-indigo-500 bg-gray-700 placeholder:text-slate-500"
                placeholder= "Input ${param.name}..."
                ${isRequired ? 'required' : ''}
                oninput="updateRequestUrl(${catIndex}, ${endpointIndex})"
                id="param-${catIndex}-${endpointIndex}-${param.name}"
            >
                               
        </div>`;
    });
    
    paramsContainer.innerHTML = paramsHtml;
    
    // Initial URL update
    setTimeout(() => {
        updateRequestUrl(catIndex, endpointIndex);
    }, 50);
}

function extractParameters(path) {
    const params = [];
    if (!path) return params;
    
    const queryString = path.split('?')[1];
    
    if (!queryString) return params;
    
    try {
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams) {
            if (value === '' || value === 'YOUR_API_KEY') {
                params.push({
                    name: key,
                    required: true,
                    type: getParamType(key),
                    description: getParamDescription(key)
                });
            }
        }
    } catch (error) {
        console.error('Error parsing query string:', error);
    }
    
    return params;
}

function getParamType(paramName) {
    const types = {
        'apikey': 'string',
        'url': 'string',
        'question': 'string',
        'query': 'string',
        'prompt': 'string',
        'format': 'string',
        'quality': 'string',
        'size': 'string',
        'limit': 'number'
    };
    return types[paramName] || 'string';
}

function getParamDescription(paramName) {
    const descriptions = {
        'apikey': 'Your API key for authentication',
        'url': 'URL of the content to download/process',
        'question': 'Question or message to ask the AI',
        'query': 'Search query or keywords',
        'prompt': 'Text description for image generation',
        'format': 'Output format (mp4, mp3, jpg, png)',
        'quality': 'Video quality (360p, 720p, 1080p)',
        'size': 'Image dimensions (512x512, 1024x1024)',
        'limit': 'Number of results to return'
    };
    return descriptions[paramName] || paramName;
}

function toggleCategory(index) {
    const category = document.getElementById(`category-${index}`);
    const icon = document.getElementById(`category-icon-${index}`);
    if (category && icon) {
        if (category.classList.contains('hidden')) {
            category.classList.remove('hidden');
            icon.textContent = 'expand_less';
        } else {
            category.classList.add('hidden');
            icon.textContent = 'expand_more';
        }
    }
}

function toggleEndpoint(catIndex, endpointIndex) {
    const endpoint = document.getElementById(`endpoint-${catIndex}-${endpointIndex}`);
    const icon = document.getElementById(`endpoint-icon-${catIndex}-${endpointIndex}`);
    if (endpoint && icon) {
        if (endpoint.classList.contains('hidden')) {
            endpoint.classList.remove('hidden');
            icon.textContent = 'expand_less';
        } else {
            endpoint.classList.add('hidden');
            icon.textContent = 'expand_more';
        }
    }
}

function updateRequestUrl(catIndex, endpointIndex) {
    const form = document.getElementById(`form-${catIndex}-${endpointIndex}`);
    if (!form) return { url: '', hasErrors: false };

    const urlDisplay = document.getElementById(`url-display-${catIndex}-${endpointIndex}`);
    if (!urlDisplay) return { url: '', hasErrors: false };

    let hasErrors = false;
    if (!urlDisplay.dataset.baseUrl) {
        const full = urlDisplay.textContent.trim();
        const [base, query] = full.split('?');
        urlDisplay.dataset.baseUrl = base;
        urlDisplay.dataset.defaultQuery = query || '';
    }
    const baseUrl = urlDisplay.dataset.baseUrl;
    const params = new URLSearchParams(urlDisplay.dataset.defaultQuery);

    const inputs = form.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        const name = input.name;
        const value = input.value.trim();

        input.classList.remove('border-red-500');

        if (input.required && !value) {
            hasErrors = true;
        }
        params.set(name, value);
    });

    const finalUrl = baseUrl + '?' + params.toString();
    urlDisplay.textContent = finalUrl;

    return { url: finalUrl, hasErrors };
}

async function executeRequest(event, catIndex, endpointIndex, method, path, produces) {
    event.preventDefault();
    
    const { url, hasErrors } = updateRequestUrl(catIndex, endpointIndex);
    
    if (hasErrors) {
        showToast('Please fill in all required parameters', 'error');
        return;
    }
    
    const responseDiv = document.getElementById(`response-${catIndex}-${endpointIndex}`);
    const responseContent = document.getElementById(`response-content-${catIndex}-${endpointIndex}`);
    const responseStatus = document.getElementById(`response-status-${catIndex}-${endpointIndex}`);
    const responseTime = document.getElementById(`response-time-${catIndex}-${endpointIndex}`);
    
    if (!responseDiv || !responseContent || !responseStatus || !responseTime) {
        showToast('Error: Response elements not found', 'error');
        return;
    }
    
    responseDiv.classList.remove('hidden');
    responseContent.innerHTML = '<div class="loader mx-auto mt-6"></div>';
    responseStatus.textContent = 'Loading...';
    responseStatus.className = 'text-xs px-2 py-1 rounded bg-gray-600 text-gray-300';
    responseTime.textContent = '';
    
    const startTime = Date.now();
    
    try {
        console.log('Request URL:', url);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': '*/*',
                'User-Agent': 'REST-API-Docs'
            }
        });
        
        const responseTimeMs = Date.now() - startTime;
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Get content type
        const contentType = response.headers.get('content-type') || '';
        
        // Update response info
        responseStatus.textContent = `${response.status} OK`;
        responseStatus.className = 'text-xs px-2 py-1 rounded bg-green-500/20 text-green-400';
        responseTime.textContent = `${responseTimeMs}ms`;
        
        // Handle different content types
        if (contentType.startsWith('image/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <img src="${blobUrl}" 
                     alt="Image Response" 
                     class="max-w-full max-h-full object-contain rounded">
            `;
            
        } else if (contentType.includes('audio/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <audio controls autoplay class="w-full max-w-md">
                    <source src="${blobUrl}" type="${contentType}">
                </audio>
            `;
            
        } else if (contentType.includes('video/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <video controls autoplay class="w-full h-full object-contain rounded">
                    <source src="${blobUrl}" type="${contentType}">
                </video>
            `;
            
        } else if (contentType.includes('application/json')) {
            const data = await response.json();
            
            if (data && typeof data === 'object' && data.error) {
                throw new Error(`API Error: ${data.error}`);
            }
            
            const formattedResponse = JSON.stringify(data, null, 2);
            responseContent.innerHTML = `
<pre class="block whitespace-pre-wrap text-xs px-4 pt-3 pb-2 overflow-x-auto leading-relaxed">
${formattedResponse}
</pre>`;
           
        } else if (contentType.includes('text/')) {
            const text = await response.text();
            responseContent.innerHTML = `
                <pre class="text-xs p-4 overflow-x-auto whitespace-pre-wrap">${escapeHtml(text)}</pre>
            `;
            
        } else {
            const text = await response.text();
            responseContent.innerHTML = `
                <pre class="text-xs p-4 overflow-x-auto whitespace-pre-wrap">${escapeHtml(text)}</pre>
            `;
        }
        
        showToast('Request successful!', 'success');
        
    } catch (error) {
        console.error('API Request Error:', error);
        
        const errorMessage = error.message || 'Unknown error occurred';
        responseContent.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-2xl text-red-400 mb-3"></i>
                <div class="text-sm font-medium text-red-400">Error</div>
                <div class="text-xs text-gray-400 mt-1">${escapeHtml(errorMessage)}</div>
            </div>
        `;
        responseStatus.textContent = 'Error';
        responseStatus.className = 'text-xs px-2 py-1 rounded bg-red-500/20 text-red-400';
        responseTime.textContent = '0ms';
        
        showToast(`Request failed: ${errorMessage}`, 'error');
    }
}

function clearResponse(catIndex, endpointIndex) {
    const form = document.getElementById(`form-${catIndex}-${endpointIndex}`);
    const responseDiv = document.getElementById(`response-${catIndex}-${endpointIndex}`);
    
    if (!form || !responseDiv) return;
    
    // Clear inputs
    const inputs = form.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        input.classList.remove('border-red-500');
    });
    
    // Hide response
    responseDiv.classList.add('hidden');
    
    // Update URL
    updateRequestUrl(catIndex, endpointIndex);
    
    showToast('Form cleared', 'info');
}

function copyUrl(catIndex, endpointIndex) {
    const urlDisplay = document.getElementById(`url-display-${catIndex}-${endpointIndex}`);
    if (!urlDisplay) return;
    
    const url = urlDisplay.textContent.trim()
    
    navigator.clipboard.writeText(url).then(() => {
        showToast('URL copied!', 'success');
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        showToast('Failed to copy URL', 'error');
    });
}

function copyResponse(catIndex, endpointIndex) {
    const responseContent = document.getElementById(`response-content-${catIndex}-${endpointIndex}`);
    if (!responseContent) return;
    
    const text = responseContent.textContent || responseContent.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Response copied!', 'success');
    }).catch(err => {
        console.error('Failed to copy response:', err);
        showToast('Failed to copy response', 'error');
    });
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    const color = {
        'success': '#10b981',
        'error': '#ef4444',
        'info': '#3b82f6'
    }[type] || '#3b82f6';
    
    toast.innerHTML = `
        <i class="fas ${icon} text-sm" style="color: ${color}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage(err = undefined) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    
    loadingScreen.innerHTML = `
        <div class="text-center">
            <i class="fas fa-wifi text-3xl text-slate-400 mb-4"></i>
            <p class="text-sm text-slate-400">${err ? err : "Using demo configuration"}</p>
        </div>
    `;
    
    // Reset settings
    settings = getDefaultSettings();
    setupUI();
    
    // Load empty data
    originalCategories = [];
    renderAPIData([]);
    
    // Setup event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            handleSearch(this.value);
        });
    }
    
    updateActiveUsers();
    
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 300);
    }, 1000);
}

// Global functions
window.toggleCategory = toggleCategory;
window.toggleEndpoint = toggleEndpoint;
window.executeRequest = executeRequest;
window.clearResponse = clearResponse;
window.copyUrl = copyUrl;
window.copyResponse = copyResponse;
window.updateRequestUrl = updateRequestUrl;