// Owner: S1 · Family, Identity & Consent — Samaranayaka S.G.V.S (IT23544154)
// Field rules for role-specific registration. Mirrored by web zod schemas and Flutter validators.
using FamilyVeda.Application.Auth;
using FamilyVeda.Application.Validation;
using FamilyVeda.Domain.Common;
using FluentAssertions;

namespace FamilyVeda.UnitTests;

public sealed class RegistrationValidatorTests
{
    private const string Password = "Synthetic-Pass-42!";
    private static readonly DateOnly AdultDob = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-30);

    private static RegisterFamilyHeadRequest Head(
        string name = "Synthetic Head", string email = "head@example.invalid", string mobile = "0771234567",
        string password = Password, string? confirm = null, DateOnly? dob = null, string nic = "200012345678",
        string district = "Kandy", string? postal = "20000", bool terms = true, ClinicalSex sex = ClinicalSex.NotSpecified) =>
        new(new AccountDetails(name, email, mobile, password, confirm ?? password),
            new PersonalDetails(dob ?? AdultDob, sex), "Synthetic Family", nic,
            new AddressDetails("12 Synthetic Lane", null, "Kandy", district, postal), terms);

    private static IEnumerable<string> Errors(RegisterFamilyHeadRequest request) =>
        new RegisterFamilyHeadRequestValidator().Validate(request).Errors.Select(e => e.PropertyName);

    [Fact]
    public void ValidFamilyHead_Passes() => Errors(Head()).Should().BeEmpty();

    [Fact]
    public void FamilyHead_RequiresFamilyName()
    {
        var request = Head() with { FamilyName = "" };
        Errors(request).Should().Contain("FamilyName");
    }

    [Theory]
    [InlineData("0771234567")]
    [InlineData("+94771234567")]
    [InlineData("077 123 4567")]
    public void MobileNumber_AcceptsSriLankanFormats(string mobile) => Errors(Head(mobile: mobile)).Should().BeEmpty();

    [Theory]
    [InlineData("0112345678")]
    [InlineData("077123456")]
    [InlineData("+1771234567")]
    [InlineData("abc")]
    public void MobileNumber_RejectsOtherFormats(string mobile) => Errors(Head(mobile: mobile)).Should().Contain("Account.MobileNumber");

    [Theory]
    [InlineData("short")]
    [InlineData("1234567")]
    [InlineData("abc")]
    public void Password_RequiresMinimumLength(string password) =>
        Errors(Head(password: password)).Should().Contain("Account.Password");

    [Fact]
    public void ConfirmPassword_MustMatch() => Errors(Head(confirm: "Different-Pass-42!")).Should().Contain("Account.ConfirmPassword");

    [Theory]
    [InlineData("A")]
    [InlineData("Synthetic Head 2")]
    [InlineData("<script>")]
    public void FullName_RejectsInvalidValues(string name) => Errors(Head(name: name)).Should().Contain("Account.FullName");

    [Fact]
    public void FullName_AllowsApostrophesHyphensAndDots() => Errors(Head(name: "K.D. O'Neil-Perera")).Should().BeEmpty();

    [Theory]
    [InlineData("199012345V")]
    [InlineData("199012345x")]
    [InlineData("200012345678")]
    public void Nic_AcceptsOldAndNewFormats(string nic) => Errors(Head(nic: nic)).Should().BeEmpty();

    [Theory]
    [InlineData("12345")]
    [InlineData("19901234V")]
    [InlineData("2000123456789")]
    public void Nic_RejectsInvalidFormats(string nic) => Errors(Head(nic: nic)).Should().Contain("NationalId");

    [Fact]
    public void DateOfBirth_RequiresAdult() =>
        Errors(Head(dob: DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-17))).Should().Contain("Personal.DateOfBirth");

    [Fact]
    public void DateOfBirth_RejectsFuture() =>
        Errors(Head(dob: DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1))).Should().Contain("Personal.DateOfBirth");

    [Fact]
    public void ClinicalSex_RejectsUnknownValue() => Errors(Head(sex: (ClinicalSex)9)).Should().Contain("Personal.SexForClinicalReference");

    [Fact]
    public void District_MustBeKnown() => Errors(Head(district: "Atlantis")).Should().Contain("Address.District");

    [Theory]
    [InlineData("2000")]
    [InlineData("ABCDE")]
    public void PostalCode_MustBeFiveDigitsWhenGiven(string postal) => Errors(Head(postal: postal)).Should().Contain("Address.PostalCode");

    [Fact]
    public void PostalCode_IsOptional() => Errors(Head(postal: null)).Should().BeEmpty();

    [Fact]
    public void Terms_MustBeAccepted() => Errors(Head(terms: false)).Should().Contain("AcceptTerms");

    [Theory]
    [InlineData(FamilyConnectionMethod.FamilyCode, null, "FV-ABC234", "Spouse", true)]
    [InlineData(FamilyConnectionMethod.FamilyCode, null, "fv-abc234", "Parent", true)]
    [InlineData(FamilyConnectionMethod.FamilyCode, null, "FV-1001", "Spouse", false)]
    [InlineData(FamilyConnectionMethod.FamilyCode, null, "FV-ABC234", "Cousin", false)]
    [InlineData(FamilyConnectionMethod.FamilyCode, null, "FV-ABC234", null, false)]
    [InlineData(FamilyConnectionMethod.Invitation, "token-value", null, null, true)]
    [InlineData(FamilyConnectionMethod.Invitation, "", null, null, false)]
    [InlineData(FamilyConnectionMethod.Later, null, null, null, true)]
    public void AdultConnection_RulesDependOnMethod(FamilyConnectionMethod method, string? token, string? code, string? relationship, bool valid)
    {
        var request = new RegisterAdultMemberRequest(
            new AccountDetails("Synthetic Adult", "adult@example.invalid", "0712345678", Password, Password),
            new PersonalDetails(AdultDob, ClinicalSex.Male),
            new AddressDetails("5 Synthetic Road", null, "Galle", "Galle", null),
            new FamilyConnection(method, token, code, relationship), true);
        new RegisterAdultMemberRequestValidator().Validate(request).IsValid.Should().Be(valid);
    }

    [Theory]
    [InlineData("12345", new[] { "Sinhala" }, true)]
    [InlineData("123", new[] { "Sinhala" }, false)]
    [InlineData("12345678901", new[] { "Sinhala" }, false)]
    [InlineData("SLMC12", new[] { "Sinhala" }, false)]
    [InlineData("12345", new string[0], false)]
    [InlineData("12345", new[] { "French" }, false)]
    [InlineData("12345", new[] { "Tamil", "Tamil" }, false)]
    public void Doctor_ValidatesSlmcAndLanguages(string slmc, string[] languages, bool valid)
    {
        var request = new RegisterDoctorAccountRequest(
            new AccountDetails("Synthetic Doctor", "doctor@example.invalid", "0771234567", Password, Password),
            slmc, "General Practice", "Synthetic Clinic", "Kandy", "Kandy", languages, true);
        new RegisterDoctorAccountRequestValidator().Validate(request).IsValid.Should().Be(valid);
    }
}
