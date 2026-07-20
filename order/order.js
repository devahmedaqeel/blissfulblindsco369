document.addEventListener('DOMContentLoaded', () => {
  const orderForm = document.getElementById('orderForm');
  const submitBtn = document.getElementById('submitBtn');
  
  // Input fields for calculation
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const quantityInput = document.getElementById('quantity');
  const fittingTypeSelect = document.getElementById('fittingType');
  const installCheckbox = document.getElementById('installationRequired');
  
  // Additional configuration fields for summary preview
  const productSelect = document.getElementById('product');
  const typeSelect = document.getElementById('blindType');
  const colourSelect = document.getElementById('colour');
  const fabricSelect = document.getElementById('fabric');
  const roomSelect = document.getElementById('room');
  
  // Ledger element targets
  const ledgerSubtotal = document.getElementById('ledgerSubtotal');
  const ledgerVat = document.getElementById('ledgerVat');
  const ledgerTotal = document.getElementById('ledgerTotal');
  const productPreview = document.getElementById('productPreview');

  // Success Screen overlays
  const successOverlay = document.getElementById('successOverlay');
  const successOrderId = document.getElementById('successOrderId');
  const successTotal = document.getElementById('successTotal');
  const successPdfLink = document.getElementById('successPdfLink');

  // Set default preferred date to +7 days in the future
  const prefDateInput = document.getElementById('preferredDate');
  if (prefDateInput) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    prefDateInput.value = nextWeek.toISOString().slice(0, 10);
    prefDateInput.min = new Date().toISOString().slice(0, 10);
  }

  /**
   * Replicates the backend pricing algorithm to show customer their instant price.
   */
  function calculatePricing() {
    const width = parseFloat(widthInput.value) || 0;
    const height = parseFloat(heightInput.value) || 0;
    const quantity = parseInt(quantityInput.value, 10) || 1;
    const fittingType = fittingTypeSelect.value;
    const installation = installCheckbox.checked;

    if (width <= 0 || height <= 0) {
      ledgerSubtotal.textContent = '£0.00';
      ledgerVat.textContent = '£0.00';
      ledgerTotal.textContent = '£0.00';
      return;
    }

    // Base price per blind
    const basePrice = 35.00;
    
    // Area rate
    const areaRate = (width * height * 0.02);
    
    let pricePerBlind = basePrice + areaRate;

    // Surcharges
    if (fittingType === 'Outside Recess') pricePerBlind += 10.00;
    if (installation) pricePerBlind += 25.00;

    const subtotal = pricePerBlind * quantity;
    const vat = subtotal * 0.20;
    const total = subtotal + vat;

    // Update Ledger UI
    ledgerSubtotal.textContent = `£${subtotal.toFixed(2)}`;
    ledgerVat.textContent = `£${vat.toFixed(2)}`;
    ledgerTotal.textContent = `£${total.toFixed(2)}`;
    
    // Update summary descriptions
    updateSummaryPreview(width, height, quantity, installation);
  }

  function updateSummaryPreview(width, height, quantity, installation) {
    const productName = productSelect.value || 'Custom Blind';
    const typeName = typeSelect.value || 'Not specified';
    const colourName = colourSelect.value || 'Not specified';
    const fabricName = fabricSelect.value || 'Not specified';
    const roomName = roomSelect.value || 'Not specified';

    productPreview.innerHTML = `
      <ul class="preview-list">
        <li><strong>Product:</strong> ${productName}</li>
        <li><strong>Style:</strong> ${typeName}</li>
        <li><strong>Colour:</strong> ${colourName}</li>
        <li><strong>Material:</strong> ${fabricName}</li>
        <li><strong>Dimensions:</strong> ${width} W x ${height} H (cm)</li>
        <li><strong>Room Location:</strong> ${roomName}</li>
        <li><strong>Fitting:</strong> ${fittingTypeSelect.value}</li>
        <li><strong>Installation:</strong> ${installation ? 'Fitting Included' : 'Supply Only'}</li>
        <li><strong>Quantity:</strong> ${quantity} units</li>
      </ul>
    `;
  }

  // Bind key inputs to trigger live updates
  const triggerFields = [widthInput, heightInput, quantityInput, fittingTypeSelect, installCheckbox, productSelect, typeSelect, colourSelect, fabricSelect, roomSelect];
  triggerFields.forEach(field => {
    if (field) {
      field.addEventListener('input', calculatePricing);
      field.addEventListener('change', calculatePricing);
    }
  });

  // Handle Form Submission
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset validations
    clearFormErrors();

    // Client-side validations
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      displayFormErrors(errors);
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing Order...';

    // Gather payload
    const payload = {
      website: document.getElementById('website').value, // honeypot
      customer: {
        name: document.getElementById('customerName').value,
        companyName: document.getElementById('companyName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        whatsappNumber: document.getElementById('whatsappNumber').value,
        address: document.getElementById('installationAddress').value,
        postcode: document.getElementById('postcode').value,
        city: document.getElementById('city').value
      },
      product: {
        name: productSelect.value,
        blindType: typeSelect.value,
        colour: colourSelect.value,
        fabric: fabricSelect.value,
        width: parseFloat(widthInput.value),
        height: parseFloat(heightInput.value),
        quantity: parseInt(quantityInput.value, 10),
        room: roomSelect.value,
        fittingType: fittingTypeSelect.value,
        installationRequired: installCheckbox.checked
      },
      scheduling: {
        preferredDate: prefDateInput.value,
        preferredTime: document.getElementById('preferredTime').value,
        specialNotes: document.getElementById('specialNotes').value
      }
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Server error occurred during checkout.');
      }

      // Populate Success Screen Details
      successOrderId.textContent = result.orderId;
      successTotal.textContent = `£${result.pricing.grandTotal.toFixed(2)}`;
      
      // Set PDF download location (pointing to public download route)
      successPdfLink.href = `/api/orders/${result.orderId}/invoice`;

      // Trigger successful view
      successOverlay.hidden = false;
      document.body.style.overflow = 'hidden';

    } catch (err) {
      alert(err.message || 'Something went wrong. Please check your details and try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Submit Order';
    }
  });

  function validateForm() {
    const err = {};
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const whatsapp = document.getElementById('whatsappNumber').value.trim();
    const address = document.getElementById('installationAddress').value.trim();
    const postcode = document.getElementById('postcode').value.trim();
    const city = document.getElementById('city').value.trim();

    if (!name) err.customerName = 'Name is required.';
    if (!email) err.customerEmail = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.customerEmail = 'Please enter a valid email address.';
    
    if (!phone) err.customerPhone = 'Phone number is required.';
    if (!whatsapp) err.whatsappNumber = 'WhatsApp number is required.';
    
    if (!address) err.installationAddress = 'Address is required.';
    if (!postcode) err.postcode = 'Postcode is required.';
    else if (!/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(postcode)) err.postcode = 'Please enter a valid UK postcode.';
    
    if (!city) err.city = 'City is required.';

    if (!productSelect.value) err.product = 'Please choose a product range.';
    if (!typeSelect.value) err.blindType = 'Please choose a style.';
    if (!colourSelect.value) err.colour = 'Please choose a colour.';
    if (!fabricSelect.value) err.fabric = 'Please choose a material option.';
    
    const w = parseFloat(widthInput.value);
    if (isNaN(w) || w < 10 || w > 500) err.width = 'Width must be between 10cm and 500cm.';
    
    const h = parseFloat(heightInput.value);
    if (isNaN(h) || h < 10 || h > 500) err.height = 'Height must be between 10cm and 500cm.';

    return err;
  }

  function displayFormErrors(errors) {
    Object.keys(errors).forEach(fieldId => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.classList.add('input-error');
        // Add visual error message
        const label = input.previousElementSibling;
        if (label) {
          const errMsg = document.createElement('span');
          errMsg.className = 'error-text';
          errMsg.style.cssText = 'color: var(--accent); font-size: 0.75rem; font-weight: normal; margin-left: 8px;';
          errMsg.textContent = `(${errors[fieldId]})`;
          label.appendChild(errMsg);
        }
      }
    });

    // Scroll to the first error
    const firstErr = document.querySelector('.input-error');
    if (firstErr) {
      firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearFormErrors() {
    document.querySelectorAll('.input-error').forEach(input => {
      input.classList.remove('input-error');
    });
    document.querySelectorAll('.error-text').forEach(msg => {
      msg.remove();
    });
  }

  // Initial pricing trigger
  calculatePricing();
});
