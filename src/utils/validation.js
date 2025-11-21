const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    
    return {
        valid: minLength && hasUpperCase && hasLowerCase,
        errors: {
            minLength: !minLength ? 'Password must be at least 6 characters' : null,
            hasUpperCase: !hasUpperCase ? 'Password must contain an uppercase letter' : null,
            hasLowerCase: !hasLowerCase ? 'Password must contain a lowercase letter' : null,
        }
    }
}

module.exports = { validateEmail, validatePassword };