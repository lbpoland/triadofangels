// Contact form: opens the visitor's email client with a pre-filled message.
// Static-site friendly (no server). No inline handlers. No HTML injection.

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusEl = document.getElementById('contact-status');
  const previewEl = document.getElementById('contact-subject-preview');
  const draftSummaryEl = document.getElementById('contact-draft-summary');
  const laneButtons = Array.from(form.ownerDocument.querySelectorAll('[data-contact-subject]'));
  const nameEl = form.querySelector('#name');
  const emailEl = form.querySelector('#email');
  const subjectEl = form.querySelector('#contact-subject');
  const messageEl = form.querySelector('#message');

  function setStatus(msg, state) {
    if (!statusEl) return;
    if (state) {
      statusEl.dataset.state = state;
    } else {
      delete statusEl.dataset.state;
    }
    statusEl.textContent = msg;
  }

  function clearStatus() {
    if (!statusEl) return;
    delete statusEl.dataset.state;
    statusEl.textContent = '';
  }

  function safeTrim(value) {
    return (value || '').toString().trim();
  }

  function isEmailLike(value) {
    const s = safeTrim(value);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function updatePreview() {
    const subject = safeTrim(subjectEl && subjectEl.value) || 'General Enquiries';
    const name = safeTrim(nameEl && nameEl.value) || 'your name';
    const messageState = safeTrim(messageEl && messageEl.value) ? 'Message draft started.' : 'Message body still empty.';
    if (previewEl) {
      previewEl.textContent = `Subject preview: Triad of Angels — ${subject} (from ${name})`;
    }
    if (draftSummaryEl) {
      draftSummaryEl.textContent = `Your email app will open a draft addressed to contact@triadofangels.com with subject “Triad of Angels — ${subject} (from ${name})”. ${messageState}`;
    }
  }

  function setPressed(button) {
    laneButtons.forEach(function (node) {
      if (!(node instanceof HTMLButtonElement)) return;
      node.setAttribute('aria-pressed', node === button ? 'true' : 'false');
    });
  }

  [nameEl, emailEl, subjectEl, messageEl].forEach(function (field) {
    if (!field) return;
    field.addEventListener('input', function () {
      clearStatus();
      updatePreview();
    });
    field.addEventListener('change', function () {
      clearStatus();
      updatePreview();
    });
  });

  if (subjectEl) {
    subjectEl.addEventListener('change', function () {
      laneButtons.forEach(function (node) {
        if (!(node instanceof HTMLButtonElement)) return;
        const matches = safeTrim(node.getAttribute('data-contact-subject')) === safeTrim(subjectEl.value);
        node.setAttribute('aria-pressed', matches ? 'true' : 'false');
      });
      updatePreview();
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = safeTrim(nameEl && nameEl.value);
    const email = safeTrim(emailEl && emailEl.value);
    const subject = safeTrim(subjectEl && subjectEl.value) || 'General Enquiries';
    const message = safeTrim(messageEl && messageEl.value);

    if (!name || !email || !message) {
      setStatus('Please fill out Name, Email, and Message.', 'error');
      return;
    }

    if (!isEmailLike(email)) {
      setStatus('Please enter a valid email address.', 'error');
      return;
    }

    const subjectLine = `Triad of Angels — ${subject} (from ${name})`;
    const body = [
      'Name: ' + name,
      'Email: ' + email,
      '',
      message,
      '',
      '—',
      'Sent via triadofangels.com contact form'
    ].join('\n');

    const mailto = 'mailto:contact@triadofangels.com'
      + '?subject=' + encodeURIComponent(subjectLine)
      + '&body=' + encodeURIComponent(body);

    setStatus('Opening your email app with the drafted message. If nothing opens, use the direct email link on this page.', 'success');
    window.location.href = mailto;
  });

  form.querySelectorAll('[data-contact-subject]').forEach(function (button) {
    button.addEventListener('click', function () {
      setPressed(button);
      const nextSubject = safeTrim(button.getAttribute('data-contact-subject'));
      const nextMessage = button.getAttribute('data-contact-message') || '';

      if (subjectEl && nextSubject) {
        subjectEl.value = nextSubject;
      }

      if (messageEl && nextMessage && !safeTrim(messageEl.value)) {
        messageEl.value = decodeURIComponent(nextMessage);
      }

      updatePreview();
      setStatus('Lane selected. Add your details, review the drafted subject, then send through your mail app.', 'success');

      const firstEmpty = [nameEl, emailEl, messageEl].find(function (field) {
        return field && !safeTrim(field.value);
      });
      if (firstEmpty) {
        firstEmpty.focus();
      }
    });
  });

  updatePreview();
});
