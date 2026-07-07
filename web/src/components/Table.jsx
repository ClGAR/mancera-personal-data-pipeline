function Table({ columns, rows, className = '' }) {
  return (
    <div className={`table-wrap ${className}`.trim()}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || row.name || row.time || rowIndex}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row, rowIndex) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
