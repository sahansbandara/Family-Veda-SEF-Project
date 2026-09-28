// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
// Server-side rules for role-specific registration. The web (zod) and Flutter forms mirror these exactly.
using System.Text.RegularExpressions;
using FamilyVeda.Application.Auth;
using FluentValidation;

namespace FamilyVeda.Application.Validation;

public static partial class RegistrationRules
{
    [GeneratedRegex(@"^[\p{L}][\p{L} .'\-]{1,119}$")] public static partial Regex FullName();
    [GeneratedRegex(@"^(?:0|\+94)7\d{8}$")] public static partial Regex SriLankaMobile();
    [GeneratedRegex(@"^(?:\d{9}[VvXx]|\d{12})$")] public static partial Regex NationalId();
    [GeneratedRegex(@"^\d{5}$")] public static partial Regex PostalCode();
    [GeneratedRegex(@"^FV-[A-HJ-NP-Z2-9]{6}$")] public static partial Regex FamilyCode();
    [GeneratedRegex(@"^\d{4,10}$")] public static partial Regex SlmcNumber();

    public static bool StrongPassword(string? value) =>
        value is { Length: >= 8 and <= 128 } && value.Any(char.IsUpper) && value.Any(char.IsLower) &&
        value.Any(char.IsDigit) && value.Any(c => !char.IsLetterOrDigit(c));

    public static bool IsAdult(DateOnly dateOfBirth) => dateOfBirth.AddYears(18) <= DateOnly.FromDateTime(DateTime.UtcNow);
}

public sealed class AccountDetailsValidator : AbstractValidator<AccountDetails>
{
    public AccountDetailsValidator()
    {
        RuleFor(x => x.FullName).Must(v => v is not null && RegistrationRules.FullName().IsMatch(v.Trim()))
            .WithMessage("Enter your full name (2–120 letters; spaces, dots, apostrophes and hyphens allowed).");
        RuleFor(x => x.Email).NotEmpty().MaximumLength(254).EmailAddress().WithMessage("Enter a valid email address.");
        RuleFor(x => x.MobileNumber).Must(v => v is not null && RegistrationRules.SriLankaMobile().IsMatch(v.Replace(" ", "")))
            .WithMessage("Enter a Sri Lankan mobile number, e.g. 0771234567 or +94771234567.");
        RuleFor(x => x.Password).Must(RegistrationRules.StrongPassword)
            .WithMessage("Password must be 8–128 characters with upper and lower case letters, a number and a symbol.");
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password).WithMessage("Passwords do not match.");
    }
}

public sealed class PersonalDetailsValidator : AbstractValidator<PersonalDetails>
{
    public PersonalDetailsValidator()
    {
        RuleFor(x => x.DateOfBirth)
            .Must(d => d >= new DateOnly(1900, 1, 1) && d < DateOnly.FromDateTime(DateTime.UtcNow)).WithMessage("Enter a valid date of birth.")
            .Must(RegistrationRules.IsAdult).WithMessage("You must be at least 18 years old to register.");
        RuleFor(x => x.SexForClinicalReference).IsInEnum().WithMessage("Choose Male, Female or Not specified.");
    }
}

public sealed class AddressDetailsValidator : AbstractValidator<AddressDetails>
{
    public AddressDetailsValidator()
    {
        RuleFor(x => x.AddressLine1).NotEmpty().WithMessage("Address line 1 is required.").MaximumLength(120);
        RuleFor(x => x.AddressLine2).MaximumLength(120);
        RuleFor(x => x.City).NotEmpty().WithMessage("City is required.").MaximumLength(80);
        RuleFor(x => x.District).Must(d => RegistrationReference.Districts.Contains(d)).WithMessage("Choose a district.");
        RuleFor(x => x.PostalCode).Must(p => string.IsNullOrWhiteSpace(p) || RegistrationRules.PostalCode().IsMatch(p.Trim()))
            .WithMessage("Postal code must be 5 digits.");
    }
}

public sealed class RegisterFamilyHeadRequestValidator : AbstractValidator<RegisterFamilyHeadRequest>
{
    public RegisterFamilyHeadRequestValidator()
    {
        RuleFor(x => x.Account).NotNull().SetValidator(new AccountDetailsValidator());
        RuleFor(x => x.Personal).NotNull().SetValidator(new PersonalDetailsValidator());
        RuleFor(x => x.Address).NotNull().SetValidator(new AddressDetailsValidator());
        RuleFor(x => x.NationalId).Must(v => v is not null && RegistrationRules.NationalId().IsMatch(v.Trim()))
            .WithMessage("Enter a synthetic NIC: 9 digits followed by V or X, or 12 digits.");
        RuleFor(x => x.AcceptTerms).Equal(true).WithMessage("Accept the terms and privacy notice to continue.");
    }
}

public sealed class RegisterAdultMemberRequestValidator : AbstractValidator<RegisterAdultMemberRequest>
{
    public RegisterAdultMemberRequestValidator()
    {
        RuleFor(x => x.Account).NotNull().SetValidator(new AccountDetailsValidator());
        RuleFor(x => x.Personal).NotNull().SetValidator(new PersonalDetailsValidator());
        RuleFor(x => x.Address).NotNull().SetValidator(new AddressDetailsValidator());
        RuleFor(x => x.Connection).NotNull();
        RuleFor(x => x.Connection.Method).IsInEnum().When(x => x.Connection is not null);
        RuleFor(x => x.Connection.InvitationToken).NotEmpty().MaximumLength(200).WithMessage("Enter your invitation token.")
            .When(x => x.Connection?.Method == FamilyConnectionMethod.Invitation);
        RuleFor(x => x.Connection.FamilyCode)
            .Must(c => c is not null && RegistrationRules.FamilyCode().IsMatch(c.Trim().ToUpperInvariant()))
            .WithMessage("Family codes look like FV-ABC234.")
            .When(x => x.Connection?.Method == FamilyConnectionMethod.FamilyCode);
        RuleFor(x => x.Connection.Relationship).Must(r => r is not null && RegistrationReference.Relationships.Contains(r))
            .WithMessage("Choose your relationship to the family.")
            .When(x => x.Connection?.Method == FamilyConnectionMethod.FamilyCode);
        RuleFor(x => x.AcceptTerms).Equal(true).WithMessage("Accept the terms and privacy notice to continue.");
    }
}

public sealed class RegisterDoctorAccountRequestValidator : AbstractValidator<RegisterDoctorAccountRequest>
{
    public RegisterDoctorAccountRequestValidator()
    {
        RuleFor(x => x.Account).NotNull().SetValidator(new AccountDetailsValidator());
        RuleFor(x => x.RegistrationNumber).Must(v => v is not null && RegistrationRules.SlmcNumber().IsMatch(v.Trim()))
            .WithMessage("SLMC registration number must be 4–10 digits.");
        RuleFor(x => x.Specialization).NotEmpty().WithMessage("Specialization is required.").MaximumLength(120);
        RuleFor(x => x.HospitalClinic).NotEmpty().WithMessage("Hospital or clinic is required.").MaximumLength(160);
        RuleFor(x => x.PracticeCity).NotEmpty().WithMessage("Practice city is required.").MaximumLength(80);
        RuleFor(x => x.District).Must(d => RegistrationReference.Districts.Contains(d)).WithMessage("Choose a district.");
        RuleFor(x => x.Languages).NotNull().Must(l => l is { Count: >= 1 and <= 3 } && l.Distinct().Count() == l.Count && l.All(RegistrationReference.Languages.Contains))
            .WithMessage("Choose at least one language: Sinhala, Tamil or English.");
        RuleFor(x => x.AcceptTerms).Equal(true).WithMessage("Accept the terms and privacy notice to continue.");
    }
}
