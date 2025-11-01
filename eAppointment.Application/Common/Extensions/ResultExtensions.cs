using eAppointment.Application.Common.Models;

namespace eAppointment.Application.Common.Extensions;

public static class ResultExtensions
{
    public static Result<T> Ensure<T>(
        this Result<T> result,
        Func<T, bool> predicate,
        Error error)
    {
        if (result.IsFailure)
            return result;

        return predicate(result.Value) ? result : Result.Failure<T>(error);
    }

    public static Result<TOut> Map<TIn, TOut>(
        this Result<TIn> result,
        Func<TIn, TOut> mappingFunc)
    {
        return result.IsSuccess
            ? Result.Success(mappingFunc(result.Value))
            : Result.Failure<TOut>(result.Error);
    }

    public static async Task<Result<TOut>> Map<TIn, TOut>(
        this Task<Result<TIn>> resultTask,
        Func<TIn, TOut> mappingFunc)
    {
        var result = await resultTask;
        return result.Map(mappingFunc);
    }

    public static Result<TOut> Bind<TIn, TOut>(
        this Result<TIn> result,
        Func<TIn, Result<TOut>> bindFunc)
    {
        return result.IsFailure ? Result.Failure<TOut>(result.Error) : bindFunc(result.Value);
    }

    public static async Task<Result<TOut>> Bind<TIn, TOut>(
        this Task<Result<TIn>> resultTask,
        Func<TIn, Task<Result<TOut>>> bindFunc)
    {
        var result = await resultTask;
        return result.IsFailure 
            ? Result.Failure<TOut>(result.Error) 
            : await bindFunc(result.Value);
    }
}

