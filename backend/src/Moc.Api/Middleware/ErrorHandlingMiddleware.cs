using System.Net;
using System.Text.Json;

namespace Moc.Api.Middleware;

/// <summary>
/// Global error handling middleware that catches unhandled exceptions and returns consistent API error responses.
/// This ensures all errors follow the same shape for the React frontend to handle uniformly.
/// </summary>
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    /// <summary>
    /// Constructs the middleware with the next delegate in the pipeline and a logger.
    /// </summary>
    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// Invokes the middleware to process the HTTP request and catch any exceptions.
    /// </summary>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    /// <summary>
    /// Handles the exception by writing a consistent error response to the HTTP context.
    /// </summary>
    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var code = HttpStatusCode.InternalServerError;
        var message = "An error occurred while processing your request.";

        // Customize error response based on exception type if needed
        // For now, we return a generic 500 error, but this can be extended
        // to handle specific exceptions (e.g., NotFoundException -> 404, ValidationException -> 400)

        var result = JsonSerializer.Serialize(new
        {
            error = new
            {
                message = message,
                statusCode = (int)code,
                // In Development, include exception details for debugging
                detail = context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment()
                    ? exception.ToString()
                    : null
            }
        }, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;

        return context.Response.WriteAsync(result);
    }
}
