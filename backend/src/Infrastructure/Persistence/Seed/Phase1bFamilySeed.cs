// Phase 1b — families, members, consents, relationships and doctors.
// See Phase1bSeeder.cs for the sentinel/idempotency contract and RULE 7 scope.
using System.Security.Cryptography;
using System.Text;
using FamilyVeda.Domain.Clinical;
using FamilyVeda.Domain.Common;
using FamilyVeda.Domain.Identity;
using FamilyVeda.Domain.Portal;

namespace FamilyVeda.Infrastructure.Persistence.Seed;

public sealed record Phase1bFamily(
    string Key,
    Family Family,
    UserAccount HeadUser,
    Member Head,
    UserAccount AdultOneUser,
    Member AdultOne,
    UserAccount AdultTwoUser,
    Member AdultTwo,
    Member MinorOne,
    Member MinorTwo);

public sealed record Phase1bDoctors(
    Doctor VerifiedOne,
    UserAccount VerifiedOneUser,
    Doctor VerifiedTwo,
    UserAccount VerifiedTwoUser,
    Doctor VerifiedThree,
    UserAccount VerifiedThreeUser,
    Doctor Pending,
    Doctor Suspended);

public static class Phase1bFamilySeed
{
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    public static IReadOnlyList<Phase1bFamily> Seed(Phase1bSeedContext ctx)
    {
        var db = ctx.Db;
        var families = new List<Phase1bFamily>
        {
            BuildFamily(ctx, "alpha", "Phase1b Alpha Family", "FV-P1BALP",
                head: ("phase1b-alpha-head@example.invalid", "Alpha Head One", new DateOnly(1978, 3, 12)),
                adultOne: ("phase1b-alpha-adult1@example.invalid", "Alpha Adult One", new DateOnly(2001, 5, 4)),
                adultTwo: ("phase1b-alpha-adult2@example.invalid", "Alpha Adult Two", new DateOnly(2003, 9, 18)),
                minorOne: ("Alpha Minor One", new DateOnly(2012, 2, 1)),
                minorTwo: ("Alpha Minor Two", new DateOnly(2016, 11, 23))),
            BuildFamily(ctx, "beta", "Phase1b Beta Family", "FV-P1BBET",
                head: ("phase1b-beta-head@example.invalid", "Beta Head One", new DateOnly(1980, 7, 2)),
                adultOne: ("phase1b-beta-adult1@example.invalid", "Beta Adult One", new DateOnly(1999, 12, 9)),
                adultTwo: ("phase1b-beta-adult2@example.invalid", "Beta Adult Two", new DateOnly(2002, 1, 30)),
                minorOne: ("Beta Minor One", new DateOnly(2011, 6, 15)),
                minorTwo: ("Beta Minor Two", new DateOnly(2015, 4, 7))),
            BuildFamily(ctx, "gamma", "Phase1b Gamma Family", "FV-P1BGAM",
                head: ("phase1b-gamma-head@example.invalid", "Gamma Head One", new DateOnly(1975, 10, 21)),
                adultOne: ("phase1b-gamma-adult1@example.invalid", "Gamma Adult One", new DateOnly(2000, 8, 8)),
                adultTwo: ("phase1b-gamma-adult2@example.invalid", "Gamma Adult Two", new DateOnly(2004, 3, 3)),
                minorOne: ("Gamma Minor One", new DateOnly(2013, 9, 9)),
                minorTwo: ("Gamma Minor Two", new DateOnly(2017, 7, 27))),
        };

        // Consent mix: NotSet (default from BuildFamily) on both minors, Granted for the head,
        // Revoked for adult one, and left NotSet for adult two — exercises all three states.
        foreach (var f in families)
        {
            SetConsents(db, f.Head, ConsentStatus.Granted, f.HeadUser);
            SetConsents(db, f.AdultOne, ConsentStatus.Revoked, f.AdultOneUser);
            // AdultTwo and both minors keep the NotSet default from BuildFamily.
        }

        // Beta's second adult also has a pending join request into the Alpha family — exercises the
        // join-by-code / "start my own family" cross-family flow without disturbing Beta's own membership.
        db.FamilyJoinRequests.Add(new FamilyJoinRequest
        {
            Family = families[0].Family,
            RequestingUser = families[1].AdultTwoUser,
            RelationshipType = "Relative",
            Message = "Requesting to also join the Alpha family account.",
        });

        return families;
    }

    private static Phase1bFamily BuildFamily(
        Phase1bSeedContext ctx,
        string key,
        string familyName,
        string familyCode,
        (string Email, string Name, DateOnly Dob) head,
        (string Email, string Name, DateOnly Dob) adultOne,
        (string Email, string Name, DateOnly Dob) adultTwo,
        (string Name, DateOnly Dob) minorOne,
        (string Name, DateOnly Dob) minorTwo)
    {
        var db = ctx.Db;
        var headUser = ctx.NewUser(head.Email, head.Name, UserType.FamilyUser);
        var family = new Family { Name = familyName, CreatedByUser = headUser, FamilyCode = familyCode };
        db.Families.Add(family);

        var headMember = NewMember(db, family, headUser, head.Name, head.Dob, FamilyRole.Head);
        var adultOneUser = ctx.NewUser(adultOne.Email, adultOne.Name, UserType.FamilyUser);
        var adultOneMember = NewMember(db, family, adultOneUser, adultOne.Name, adultOne.Dob, FamilyRole.AdultMember);
        var adultTwoUser = ctx.NewUser(adultTwo.Email, adultTwo.Name, UserType.FamilyUser);
        var adultTwoMember = NewMember(db, family, adultTwoUser, adultTwo.Name, adultTwo.Dob, FamilyRole.AdultMember);
        var minorOneMember = NewMember(db, family, null, minorOne.Name, minorOne.Dob, FamilyRole.MinorMember);
        var minorTwoMember = NewMember(db, family, null, minorTwo.Name, minorTwo.Dob, FamilyRole.MinorMember);

        db.Relationships.AddRange(
            new Relationship { Member = headMember, RelatedMember = minorOneMember, RelationshipType = "guardian", IsBiological = true },
            new Relationship { Member = minorOneMember, RelatedMember = headMember, RelationshipType = "parent", IsBiological = true },
            new Relationship { Member = headMember, RelatedMember = minorTwoMember, RelationshipType = "guardian", IsBiological = true },
            new Relationship { Member = minorTwoMember, RelatedMember = headMember, RelationshipType = "parent", IsBiological = true });

        return new Phase1bFamily(key, family, headUser, headMember, adultOneUser, adultOneMember, adultTwoUser, adultTwoMember, minorOneMember, minorTwoMember);
    }

    private static Member NewMember(AppDbContext db, Family family, UserAccount? user, string name, DateOnly dob, FamilyRole role)
    {
        var member = new Member { Family = family, User = user, DisplayName = name, DateOfBirth = dob, Role = role };
        db.Members.Add(member);
        // NotSet default per Consent entity — the consent "not-set" state for this seed.
        foreach (var category in Enum.GetValues<ConsentCategory>())
            db.Consents.Add(new Consent { Member = member, Category = category, Status = ConsentStatus.NotSet });
        return member;
    }

    private static void SetConsents(AppDbContext db, Member member, ConsentStatus status, UserAccount grantedBy)
    {
        foreach (var consent in db.ChangeTracker.Entries<Consent>().Select(e => e.Entity).Where(c => c.MemberId == member.Id))
        {
            consent.Status = status;
            if (status == ConsentStatus.Granted)
            {
                consent.GrantedByUser = grantedBy;
                consent.GrantedAt = DateTimeOffset.UtcNow;
            }
            else if (status == ConsentStatus.Revoked)
            {
                consent.GrantedByUser = grantedBy;
                consent.GrantedAt = DateTimeOffset.UtcNow.AddDays(-30);
                consent.RevokedAt = DateTimeOffset.UtcNow.AddDays(-2);
            }
        }
    }

    public static Phase1bDoctors SeedDoctors(Phase1bSeedContext ctx, IReadOnlyList<Phase1bFamily> families)
    {
        var db = ctx.Db;
        var verifiedOneUser = ctx.NewUser("phase1b-doctor-jaffna@example.invalid", "Dr. Phase1b Jaffna", UserType.Doctor);
        var verifiedOne = new Doctor
        {
            User = verifiedOneUser, RegistrationNumberHash = Hash("PHASE1B-VERIFIED-1"), RegistrationNumberLastFour = "1001",
            VerificationStatus = VerificationStatus.Verified, Specialty = "General Practice", HospitalClinic = "Northern Demo Clinic",
            District = "Jaffna", City = "Jaffna", Languages = "Tamil, English",
        };
        var verifiedTwoUser = ctx.NewUser("phase1b-doctor-badulla@example.invalid", "Dr. Phase1b Badulla", UserType.Doctor);
        var verifiedTwo = new Doctor
        {
            User = verifiedTwoUser, RegistrationNumberHash = Hash("PHASE1B-VERIFIED-2"), RegistrationNumberLastFour = "1002",
            VerificationStatus = VerificationStatus.Verified, Specialty = "Family Medicine", HospitalClinic = "Uva Demo Clinic",
            District = "Badulla", City = "Bandarawela", Languages = "Sinhala, English",
        };
        var verifiedThreeUser = ctx.NewUser("phase1b-doctor-matara@example.invalid", "Dr. Phase1b Matara", UserType.Doctor);
        var verifiedThree = new Doctor
        {
            User = verifiedThreeUser, RegistrationNumberHash = Hash("PHASE1B-VERIFIED-3"), RegistrationNumberLastFour = "1003",
            VerificationStatus = VerificationStatus.Verified, Specialty = "General Practice", HospitalClinic = "Southern Demo Clinic",
            District = "Matara", City = "Matara", Languages = "Sinhala, Tamil, English",
        };
        var pendingUser = ctx.NewUser("phase1b-doctor-pending@example.invalid", "Dr. Phase1b Pending", UserType.Doctor);
        var pending = new Doctor
        {
            User = pendingUser, RegistrationNumberHash = Hash("PHASE1B-PENDING"), RegistrationNumberLastFour = "1004",
            VerificationStatus = VerificationStatus.Pending, Specialty = "General Practice", District = "Kurunegala", City = "Kurunegala", Languages = "Sinhala",
        };
        var suspendedUser = ctx.NewUser("phase1b-doctor-suspended@example.invalid", "Dr. Phase1b Suspended", UserType.Doctor);
        var suspended = new Doctor
        {
            User = suspendedUser, RegistrationNumberHash = Hash("PHASE1B-SUSPENDED"), RegistrationNumberLastFour = "1005",
            VerificationStatus = VerificationStatus.Suspended, Specialty = "General Practice", District = "Colombo", City = "Colombo 03", Languages = "English",
        };
        db.Doctors.AddRange(verifiedOne, verifiedTwo, verifiedThree, pending, suspended);

        var gamma = families.Single(f => f.Key == "gamma");
        db.FamilyDoctorAssignments.Add(new FamilyDoctorAssignment { Family = gamma.Family, Doctor = verifiedOne, IsPrimary = true });

        var beta = families.Single(f => f.Key == "beta");
        db.FamilyDoctorRequests.Add(new FamilyDoctorRequest
        {
            Family = beta.Family, Doctor = verifiedTwo, RequestedByUserId = beta.HeadUser.Id,
            Message = "Requesting Dr. Phase1b Badulla as our family doctor.",
        });

        return new Phase1bDoctors(verifiedOne, verifiedOneUser, verifiedTwo, verifiedTwoUser, verifiedThree, verifiedThreeUser, pending, suspended);
    }
}
