/**
 * CSS/DOM Scene Management for Shosen (No Three.js)
 */

let avatarContainer;
let head, body, leftArm, rightArm;
let targetColor = '#4caf50'; // Default safety green

function initScene() {
    const container = document.getElementById('customer-scene');
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';
    container.style.perspective = '1000px';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    // Create Avatar Group
    avatarContainer = document.createElement('div');
    avatarContainer.className = 'avatar-group';

    // Head
    head = document.createElement('div');
    head.className = 'avatar-head';

    // Body
    body = document.createElement('div');
    body.className = 'avatar-body';

    // Arms Area (Container for arms)
    const armsContainer = document.createElement('div');
    armsContainer.className = 'avatar-arms';

    leftArm = document.createElement('div');
    leftArm.className = 'avatar-arm left';

    rightArm = document.createElement('div');
    rightArm.className = 'avatar-arm right';

    armsContainer.appendChild(leftArm);
    armsContainer.appendChild(rightArm);

    // Assemble
    avatarContainer.appendChild(head);
    avatarContainer.appendChild(armsContainer); // Arms behind body logically? Or attached. CSS Z-index handles it.
    avatarContainer.appendChild(body);

    container.appendChild(avatarContainer);

    // Initial Color
    updateAvatarColor(targetColor);
}

function updateAvatarColor(color) {
    targetColor = color;
    if (body) body.style.background = `linear-gradient(135deg, ${color}, #222)`;
    if (head) head.style.background = '#ffe0bd'; // Skin tone stays
    if (leftArm) leftArm.style.background = `linear-gradient(135deg, ${color}, #111)`;
    if (rightArm) rightArm.style.background = `linear-gradient(135deg, ${color}, #111)`;

    // Trigger "Happy" animation
    if (avatarContainer) {
        avatarContainer.classList.remove('anim-happy');
        void avatarContainer.offsetWidth; // Trigger reflow
        avatarContainer.classList.add('anim-happy');
    }
}

// Global hook
window.updateCustomerColor = function (colorHex) {
    updateAvatarColor(colorHex);
};

// Initialize
window.addEventListener('DOMContentLoaded', initScene);
