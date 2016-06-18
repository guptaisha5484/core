import { navigateTo,
  inputById,
  selectOptionById,
  buttonPressByText,
  buttonPressBySelector,
  innerTextByClass,
} from './common';

export const startAtRegister = () => navigateTo('/');
export const enterContactName = text => inputById('contactName', text);
export const enterContactLastName = text => inputById('contactLastName', text);
export const enterContactNumber = text => inputById('contactNumber', text);
export const enterMemberName = text => inputById('memberName', text);
export const enterMemberLastName = text => inputById('memberLastName', text);
export const enterContactEmail = text => inputById('contactEmail', text);
export const enterMemberBirthYear = text => inputById('memberBirthYear', text);
export const enterAdditionalInfo = text => inputById('additionalInfo', text);
export const selectLab = selection => selectOptionById('labSelection', selection);
export const selectSchoolType = selection => buttonPressBySelector(`input[id=schoolType${selection}]`);
export const enterOtherSchool = text => inputById('schoolTypeOtherText', text);
export const clickRegister = () => buttonPressByText('Register');
export const visibleProgressMessage = () => innerTextByClass('form-title');
export const visibleValidationErrors = () => innerTextByClass('validationErrors');
