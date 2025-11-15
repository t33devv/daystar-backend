const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return {
        valid: minLength && hasUpperCase && hasLowerCase && hasNumber,
        errors: {
            minLength: !minLength ? 'Password must be at least 8 characters' : null,
            hasUpperCase: !hasUpperCase ? 'Password must contain an uppercase letter' : null,
            hasLowerCase: !hasLowerCase ? 'Password must contain a lowercase letter' : null,
            hasNumber: !hasNumber ? 'Password must contain a number' : null,
        }
    }
}

module.exports = { validateEmail, validatePassword };