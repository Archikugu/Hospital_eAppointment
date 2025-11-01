namespace eAppointment.Application.Common.Models;

public class Error
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error NullValue = new("Error.NullValue", "The result value is null.");

    public string Code { get; }
    public string Message { get; }

    public Error(string code, string message)
    {
        Code = code;
        Message = message;
    }

    public static Error Failure(string code, string message) => new(code, message);
    public static Error NotFound(string entityName, object id) => 
        new("Error.NotFound", $"{entityName} with id {id} was not found.");
    
    public static Error Validation(string message) => 
        new("Error.Validation", message);

    public static Error Conflict(string message) => 
        new("Error.Conflict", message);

    public static bool operator ==(Error? left, Error? right)
    {
        if (left is null && right is null)
            return true;

        if (left is null || right is null)
            return false;

        return left.Code == right.Code && left.Message == right.Message;
    }

    public static bool operator !=(Error? left, Error? right) => !(left == right);

    public override bool Equals(object? obj) => 
        obj is Error error && Code == error.Code && Message == error.Message;

    public override int GetHashCode() => HashCode.Combine(Code, Message);
}

