import * as ff from './filter_functions.js'
import { createTable } from './script.js';

export default function test_export(){
  console.log('Imported table_function')
}
// For later use: Spawn a div to edit a cell 
// if the text width is greater that the text width
function getTextContentWidth(element: any) {
  const text = element.textContent;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context!.font = getComputedStyle(element).font;
  const width = context!.measureText(text).width;

  return width;
}

function createTableContainer(tableNumber: number) {
  let tableContainer = document.createElement("div");
  tableContainer.classList.add("m-table-container");
  tableContainer.id = `m-table-container-${tableNumber}`;
  return tableContainer;
}

export class MTable {
  host: HTMLElement | null;
  headers: string[];
  rows: (string | number)[][];
  constructor(DOMElement: HTMLElement | null, TableHeaders: string[], tableRows: (string | number)[][]) {
    this.host = DOMElement;
    this.headers = TableHeaders;
    this.rows = tableRows;
  }
  getTableId(): number{
    let mTables: NodeListOf<HTMLTableElement>;
    mTables = document.querySelectorAll(".m-table");
    return mTables.length + 1;
  }
  spawnMTableContainer() {
    let container = createTableContainer(this.getTableId());
    this.host!.appendChild(container);
    return container;
  }
  spawnMTable() {
    let MTableContainer = this.spawnMTableContainer();
    createTable(
      MTableContainer,
      1300,
      `m-table-${this.getTableId()}`,
      "m-table",
      this.headers,
      this.rows
    );
  }
}

export class TableContainerCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  constructor(container: HTMLElement) {
    this.x = container.offsetLeft;
    this.y = container.offsetTop;
    this.width = container.getBoundingClientRect().width;
    this.height = container.getBoundingClientRect().height;
    this.right = this.x + this.width;
    this.bottom = this.y + this.height;
  }
}

export class TableContainerScrollOffset {
  x: number;
  y: number;
  constructor(container: HTMLElement) {
    this.x = container.scrollLeft;
    this.y = container.scrollTop;
  }
}


export function createTableLayout(
  tableWidth: number,
  tableId: string,
  tableClassName: string,
  tableNumberOnPage: number,
  headers: string | any[],
  rows: string | any[][]
) { 
  const table = document.createElement("table");
  //console.log(table)
  const tableHeader = document.createElement("thead");
  const tableHeaderRow = document.createElement("tr");
  let tablefirstcolumnEmptyHeader = document.createElement("th");
  tablefirstcolumnEmptyHeader.style.width = "20px";
  tablefirstcolumnEmptyHeader.dataset.header = "0";
  tablefirstcolumnEmptyHeader.dataset.parentTable = String(tableNumberOnPage);
  tableHeaderRow.appendChild(tablefirstcolumnEmptyHeader);
  for (let index = 0; index < headers.length; index++) {
    let colHeader = document.createElement("th");
    colHeader.dataset.header = `${index + 1}`;
    colHeader.dataset.parentTable = String(tableNumberOnPage);
    colHeader.textContent = headers[index];
    tableHeaderRow.appendChild(colHeader);
  }
  tableHeader.appendChild(tableHeaderRow);

  const tableBody = document.createElement("tbody");
  for (let index = 0; index < rows.length; index++) {
    let tableRow = document.createElement("tr");
    tableRow.dataset.rowFiltered = "0";
    let rowHeader = document.createElement("th");
    rowHeader.textContent = String(index + 1);
    rowHeader.dataset.rowHeader = String(index + 1);
    tableRow.appendChild(rowHeader);
    for (let valueIndex = 0; valueIndex < rows[index].length; valueIndex++) {
      let rowValue = document.createElement("td");
      rowValue.dataset.row = String(index + 1);
      rowValue.dataset.column = String(valueIndex + 1);
      rowValue.textContent = rows[index][valueIndex];
      tableRow.appendChild(rowValue);
      rowValue.addEventListener("dblclick", () => {
        rowValue.contentEditable = "true";
        rowValue.focus();
      });
      rowValue.addEventListener("blur", () => {
        rowValue.contentEditable = "false";
      });
      rowValue.addEventListener("focus", (event) => {
        let range = document.createRange();
        range.selectNodeContents(event.target as Node);
        range.collapse(false);
        let windowSelection = window.getSelection();
        windowSelection.removeAllRanges();
        windowSelection.addRange(range);
      });
    }
    tableBody.appendChild(tableRow);
  }

  table.appendChild(tableHeader);
  table.appendChild(tableBody);

  table.style.width = `${tableWidth}px`;
  table.id = String(tableId);
  table.className = tableClassName;
  table.dataset.tableNumber = String(tableNumberOnPage);

  return table;
}


// Create a highlighter on the clicked cell
export function createCellSelector(target: HTMLElement, tableNumberOnPage: number, cellWidth: number, cellHeight: number) {
  let cellSelector = document.createElement("div");
  cellSelector.className = "cell-selector";
  cellSelector.role = "selector";
  cellSelector.dataset.ownerTable = String(tableNumberOnPage);
  let selectorX = target.offsetLeft;
  let selectorY = target.offsetTop;
  //let selectorBorderLeft = parseFloat(window.getComputedStyle(cellSelector).borderLeftWidth);
  //let selectorBorderTop = parseFloat(window.getComputedStyle(cellSelector).borderTopWidth);
  Object.assign(cellSelector.style, {
    position: "absolute",
    top: `${selectorY - 2 /* - selectorBorderTop*/}px`, // minus 2 border of cell selector
    left: `${selectorX - 2 /* - selectorBorderLeft*/}px`, //minus 2 border of cell selector
    width: `${cellWidth}px`,
    height: `${cellHeight}px`,
    pointerEvents: "none",
  });
  return cellSelector;
}

export function createRangeSelectionHighlighter(table: HTMLTableElement, tableNumberOnPage: number) {
  let selectionAreaHighlighter = document.createElement("div");
  selectionAreaHighlighter.className = "selection-area-highlighter";
  selectionAreaHighlighter.id = `selection-area-table-${tableNumberOnPage}`;
  selectionAreaHighlighter.dataset.ownerTable = String(tableNumberOnPage);
  selectionAreaHighlighter.role = "range-selection-highlight";
  selectionAreaHighlighter.style.display = "none";
  selectionAreaHighlighter.style.pointerEvents = "none";
  selectionAreaHighlighter.style.position = "absolute";
  table.appendChild(selectionAreaHighlighter);
}

// Add resizers to the header of the table
export function addResizersToTable(table: HTMLElement) {
  const tableHeaders = table.querySelectorAll("thead th");
  for (var c = 1; c < tableHeaders.length; c++) {
    let headerResizer = document.createElement("div");
    headerResizer.className = "column-resizers";
    headerResizer.dataset.columnResizer = String(c);
    headerResizer.style.zIndex = "1";
    tableHeaders[c].appendChild(headerResizer);
  }
}

/* Filters */

//crate a custom context menu div for the headers
export function makeCustomContextMenu(x: number, y: number, tableNumberOnPage: number) {
  let customContextMenu = document.createElement("div");
  customContextMenu.className = "menu-filter-context-menu";
  (customContextMenu as HTMLElement).dataset.ownerTable = String(tableNumberOnPage);
  let customContextMenuItem = document.createElement("div");
  customContextMenuItem.className = "filter-context-menu-item";
  customContextMenuItem.role = "header-context-menu";
  let customContextMenuItem1 = customContextMenuItem.cloneNode(true);
  (customContextMenuItem1 as HTMLElement).innerText = "Create Filter";
  (customContextMenuItem1 as HTMLElement).dataset.menuFuntion = "1";
  customContextMenu.appendChild(customContextMenuItem1);
  let customContextMenuItem2 = customContextMenuItem.cloneNode(true);
  (customContextMenuItem2 as HTMLElement).innerText = "Remove Filter";
  (customContextMenuItem2 as HTMLElement).dataset.menuFuntion = "0";
  customContextMenu.appendChild(customContextMenuItem2);

  Object.assign(customContextMenu.style, {
    left: `${x}px`,
    top: `${y}px`,
  });
  return customContextMenu;
}

//crate a custom context menu for range selection
export function makeCustomContextMenuRangeSelection(x: number, y: number, tableNumberOnPage: number) {
  let customContextMenu = document.createElement("div");
  customContextMenu.className = "menu-range-selection-context-menu";
  customContextMenu.dataset.ownerTable = String(tableNumberOnPage);
  let customContextMenuItem = document.createElement("div");
  customContextMenuItem.className = "range-selection-context-menu-item";
  customContextMenuItem.role = "range-selection-context-menu";
  let customContextMenuItem1 = customContextMenuItem.cloneNode(true);
  (customContextMenuItem1 as HTMLElement).innerText = "Copy";
  (customContextMenuItem1 as HTMLElement).dataset.menuFuntion = "1";
  customContextMenu.appendChild(customContextMenuItem1);

  Object.assign(customContextMenu.style, {
    left: `${x}px`,
    top: `${y}px`,
  });
  return customContextMenu;
}

function addFiltersToTable(table: HTMLTableElement) {
  const tableHeaders = table.querySelectorAll("thead th");
  for (var c = 1; c < tableHeaders.length; c++) {
    let tableFilter = document.createElement("div");
    tableFilter.id = `filter-${c}`;
    tableFilter.className = "table-filters";
    tableFilter.dataset.columnFilter = String(c);
    tableFilter.dataset.ownerTable = table.dataset.tableNumber;
    tableFilter.dataset.filterApplied = "0";
    tableFilter.dataset.lastFilterApplied = "0";
    tableHeaders[c].appendChild(tableFilter);
  }
}

// Make a filter div
function createFilterTable(
  table: HTMLTableElement,
  container: HTMLDivElement,
  tableNumberOnPage: number,
  colNumber: number,
  show: boolean
) {
  function createTableRow() {
    let filterTableRow = document.createElement("tr");
    return filterTableRow;
  }
  let allColumnValues;
  let uniqueColumValuesList;

  let filterContainer = document.createElement("div");
  filterContainer.className = "table-filters-container";
  filterContainer.id = `filter-col-${colNumber}`;
  filterContainer.dataset.colNumber = String(colNumber);
  filterContainer.dataset.ownerTable = String(tableNumberOnPage);
  filterContainer.role = "filter-element";
  let filterTable = document.createElement("table");
  filterTable.className = "filter-elements";
  filterTable.dataset.ownerColumn = String(colNumber);
  filterTable.role = "filter-element";
  let filterTableRow = createTableRow();

  let filterTableHeader = document.createElement("th");
  filterTableHeader.innerText = `Filter ${
    table.rows[0].cells[colNumber].textContent
  }`;
  filterTableHeader.role = "filter-element";
  filterTableRow.appendChild(filterTableHeader);
  filterTable.appendChild(filterTableRow);

  filterTableRow = createTableRow();
  let sortAZ = document.createElement("td");
  sortAZ.innerText = "Sort A to Z";
  sortAZ.classList.add("filter-sort-az");
  sortAZ.classList.add("filter-table-cell");
  sortAZ.role = "filter-element";
  sortAZ.dataset.ownerTable = String(tableNumberOnPage);
  sortAZ.dataset.forColumn = String(colNumber);

  sortAZ.addEventListener("mousedown", () => {
    ff.sortTable(table, colNumber - 1, 1);
    filterContainer.style.display = "none";
  });

  filterTableRow.appendChild(sortAZ);
  filterTable.appendChild(filterTableRow);

  filterTableRow = createTableRow();
  let sortZA = document.createElement("td");
  sortZA.innerText = "Sort Z to A";
  sortZA.classList.add("filter-sort-za");
  sortZA.classList.add("filter-table-cell");
  sortZA.role = "filter-element";
  sortZA.dataset.ownerTable = String(tableNumberOnPage);
  sortZA.dataset.forColumn = String(colNumber);

  sortZA.addEventListener("mousedown", () => {
    ff.sortTable(table, colNumber - 1, -1);
    filterContainer.style.display = "none";
  });

  filterTableRow.appendChild(sortZA);
  filterTable.appendChild(filterTableRow);

  filterTableRow = createTableRow();
  let columnFilter = document.createElement("td");
  columnFilter.classList.add("column-filter");
  columnFilter.classList.add("filter-table-cell");
  columnFilter.role = "filter-element";
  let columnFilterInput = document.createElement("input");
  columnFilterInput.type = "text";
  columnFilterInput.placeholder = "Filter...";
  columnFilterInput.role = "filter-element";
  columnFilterInput.className = "column-filter-input";
  columnFilterInput.id = `mt-${tableNumberOnPage}-c-${colNumber}`;
  columnFilter.appendChild(columnFilterInput);
  filterTableRow.appendChild(columnFilter);
  filterTable.appendChild(filterTableRow);

  filterTableRow = createTableRow();
  let columnDistinctEntries = document.createElement("td");
  columnDistinctEntries.classList.add("column-distinct");
  columnDistinctEntries.classList.add("filter-table-cell");
  columnDistinctEntries.role = "filter-element";
  let columnDistinctEntriesContainer = document.createElement("div");
  columnDistinctEntriesContainer.className = "column-distinct-area";
  columnDistinctEntriesContainer.role = "filter-element";
  columnDistinctEntriesContainer.dataset.ownerTable = String(tableNumberOnPage);
  columnDistinctEntriesContainer.dataset.forColumn = String(colNumber);

  allColumnValues = ff.createSortedUniqueArrayFromTableColumn(table, colNumber, false);
  uniqueColumValuesList = ff.createCheckboxListFromArray(
    allColumnValues,
    "m-table-filter-cb-child-item",
    "m-table-filter-cb-parent-item",
    "m-table-filter-cb-parent-list",
    "m-table-filter-cb-children-list",
    tableNumberOnPage,
    colNumber
  );
  columnDistinctEntriesContainer.textContent = "";
  columnDistinctEntriesContainer.appendChild(uniqueColumValuesList);

  columnFilterInput.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  columnFilterInput.addEventListener("keyup", () => {
    ff.searchCheckboxListItems(
      container,
      tableNumberOnPage,
      colNumber,
      columnFilterInput.value
    );
  });

  columnDistinctEntries.appendChild(columnDistinctEntriesContainer);
  filterTableRow.appendChild(columnDistinctEntries);
  filterTable.appendChild(filterTableRow);

  filterTableRow = createTableRow();
  let filterButtons = document.createElement("td");
  filterButtons.classList.add("filter-buttons");
  filterButtons.classList.add("filter-table-cell");
  filterButtons.role = "filter-element";
  let filterApplyButton = document.createElement("button");
  filterApplyButton.innerText = "Apply";
  filterApplyButton.role = "filter-element";

  // apply selected filter
  filterApplyButton.addEventListener("click", () => {
    ff.applyFilter(container, table, tableNumberOnPage, colNumber);
  });

  let filterCancelButton = document.createElement("button");
  filterCancelButton.innerText = "Canel";
  filterButtons.appendChild(filterApplyButton);
  filterButtons.appendChild(filterCancelButton);
  filterTableRow.appendChild(filterButtons);
  filterTable.appendChild(filterTableRow);

  filterContainer.appendChild(filterTable);
  if (show) {
    return filterContainer;
  } else {
    filterContainer.style.display = "none";
    return filterContainer;
  }
}

export function createFiltersForTable(table: HTMLTableElement, container: HTMLDivElement, tableNumberOnPage: number) {
  if (table.getElementsByClassName("table-filters").length < 1) {
    addFiltersToTable(table);
    // Create filters
    function createFilter() {
      let filterSpawners = table.getElementsByClassName("table-filters");
      //debug filter here
      // let filtersTempContainer = document.createElement("div");
      // filtersTempContainer.className = "tempf";
      // container.appendChild(filtersTempContainer);
       for (let f = 0; f < filterSpawners.length; f++) {
        // debug filter here
        container.appendChild(createFilterTable(table, container, tableNumberOnPage , f + 1, false));
        // filtersTempContainer.appendChild(
        //   createFilterTable(table, container, tableNumberOnPage, f + 1, true)
        // );
      }
      container.addEventListener("mousedown", (event) => {
        // debug filter
        let tableFilterContainers = container.getElementsByClassName('table-filters-container');
        if ((event.target as HTMLElement).className == 'table-filters'){
          for (let filterContainer of tableFilterContainers){
            (filterContainer as HTMLElement).style.display = 'none';
          };
          let filterElement = tableFilterContainers[parseInt((event.target as HTMLElement).dataset.columnFilter) - 1]
          let filterPositionX = (event.target as HTMLElement).getBoundingClientRect().x + window.scrollX;
          let filterPositionY = (event.target as HTMLElement).getBoundingClientRect().y + window.scrollY;
          if ((filterElement as HTMLElement).style.display == 'none'){
            Object.assign((filterElement as HTMLElement).style, {
              display: '',
              top: `${filterPositionY + 20}px`,
              left: `${filterPositionX}px`,
            });
          } else {
            // this does not hide the filter since all the filters get hidden when one filter spawner is clicked
            (filterElement as HTMLElement).style.display = 'none';
          }
        } else {
          if ((event.target as HTMLElement).role != 'filter-element' && (event.target as HTMLElement).tagName != 'INPUT' && (event.target as HTMLElement).tagName != 'LABEL'){
            for (let filterContainer of tableFilterContainers){
              (filterContainer as HTMLElement).style.display = 'none';
            }
          }
        }
      });
    }
    // Spawn filter
    function spawnFilter() {
      createFilter();
    }

    // Actually spawn the filter
    spawnFilter();
  }
}
