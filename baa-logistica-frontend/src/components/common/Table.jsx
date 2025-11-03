// ============================================
// src/components/common/Table.jsx
// ============================================
const getNestedValue = (object, path) => {
  if (!object || !path) return undefined;

  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), object);
};

const Table = ({ columns = [], data = [], onRowClick }) => {
  const hasData = data.length > 0;

  return (
    <div className="table-wrapper table-wrapper--scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasData ? (
            data.map((row, rowIndex) => {
              const rowClasses = [onRowClick ? 'table-row--clickable' : '']
                .filter(Boolean)
                .join(' ');

              return (
                <tr
                  key={rowIndex}
                  className={rowClasses}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIndex) => {
                    const content = column.render
                      ? column.render(row)
                      : column.accessor?.includes('.')
                        ? getNestedValue(row, column.accessor)
                        : column.accessor
                          ? row[column.accessor]
                          : undefined;

                    const cellValue = content ?? '—';
                    const cellClasses = [column.align === 'right' ? 'numeric' : '']
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <td key={colIndex} className={cellClasses}>
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                Nenhum registro encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
