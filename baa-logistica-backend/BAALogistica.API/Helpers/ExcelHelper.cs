using System;
using ClosedXML.Excel;
using System.Globalization;
using System.Text;

namespace BAALogistica.API.Helpers;

public static class ExcelHelper
{
    private static readonly CultureInfo[] SupportedCultures =
    {
        CultureInfo.InvariantCulture,
        new CultureInfo("pt-BR")
    };

    public static string NormalizeDigits(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var builder = new StringBuilder(value.Length);
        foreach (var ch in value)
        {
            if (char.IsDigit(ch))
            {
                builder.Append(ch);
            }
        }

        return builder.ToString();
    }

    public static string NormalizeText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    public static bool TryGetDate(IXLCell cell, out DateTime date)
    {
        if (cell.DataType == XLDataType.DateTime)
        {
            date = cell.GetDateTime().Date;
            return true;
        }

        var text = NormalizeText(cell.GetValue<string>());
        if (string.IsNullOrEmpty(text))
        {
            date = default;
            return false;
        }

        foreach (var culture in SupportedCultures)
        {
            if (DateTime.TryParse(text, culture, DateTimeStyles.AssumeLocal, out date))
            {
                date = date.Date;
                return true;
            }
        }

        date = default;
        return false;
    }

    public static decimal? GetDecimal(IXLCell cell)
    {
        if (cell.DataType == XLDataType.Number)
        {
            return Convert.ToDecimal(cell.GetDouble(), CultureInfo.InvariantCulture);
        }

        var text = NormalizeText(cell.GetValue<string>());
        if (string.IsNullOrEmpty(text))
        {
            return null;
        }

        foreach (var culture in SupportedCultures)
        {
            if (decimal.TryParse(text, NumberStyles.Any, culture, out var value))
            {
                return value;
            }
        }

        return null;
    }

    public static int? GetInt(IXLCell cell)
    {
        if (cell.DataType == XLDataType.Number)
        {
            return (int)Math.Round(cell.GetDouble());
        }

        var text = NormalizeText(cell.GetValue<string>());
        if (string.IsNullOrEmpty(text))
        {
            return null;
        }

        foreach (var culture in SupportedCultures)
        {
            if (int.TryParse(text, NumberStyles.Any, culture, out var value))
            {
                return value;
            }
        }

        return null;
    }

    public static string? GetString(IXLCell cell)
    {
        var value = NormalizeText(cell.GetValue<string>());
        return string.IsNullOrEmpty(value) ? null : value;
    }
}
