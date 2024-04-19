import * as tf from './table_functions.js'
import * as ff from './filter_functions.js'
import { data } from './data.js';

/*  Make Table:*/
// Create an html table (number of colums, number of rows, table width, table id)
export function createTable(
  container: HTMLDivElement, 
  tableWidth: number, 
  tableId: string, 
  tableClassName: string, 
  headers: string[], 
  rows: (string | number)[][]
) {
  let numberMTablesOnPage = document.getElementsByClassName("m-table").length;
  let tableNumberOnPage = numberMTablesOnPage + 1;

  let table = tf.createTableLayout(
    tableWidth,
    tableId,
    tableClassName,
    tableNumberOnPage,
    headers,
    rows
  );
  container.appendChild(table);
  let containerDimensions = new tf.TableContainerCoordinates(container);
  // No highlighted cell or range of cells
  let columnOfSelectedCell = -1;
  let selectionRangeHighlighter = false;

  // Spawn cell selector
  let tableCells = table.getElementsByTagName("td");
  table.addEventListener("mousedown", (event) => {
    if (event.button == 0){
      if (event.target && (event.target as HTMLElement).tagName == "TD") {
        columnOfSelectedCell = parseInt((event.target as HTMLElement).dataset.column ?? "");
        for (let cell of tableCells) {
          cell.removeAttribute("class");
        }
        const selectionAreaElement = document.getElementById(`selection-area-table-${tableNumberOnPage}`);
        if (selectionAreaElement) {
          selectionAreaElement.style.display = "none";
        }
        selectionRangeHighlighter = false;
        (event.target as HTMLElement).className = "selected-cell";
        let cellDimesntions = (event.target as HTMLElement).getBoundingClientRect();
        let cellSelector = tf.createCellSelector(
          (event.target as HTMLElement),
          tableNumberOnPage,
          cellDimesntions.width,
          cellDimesntions.height
        );
  
        if (table.getElementsByClassName("cell-selector").length > 0) {
          table.removeChild(table.getElementsByClassName("cell-selector")[0]);
          table.appendChild(cellSelector);
        } else {
          table.appendChild(cellSelector);
        }
      }
    }
  });

  tf.createRangeSelectionHighlighter(table, tableNumberOnPage);
  function drawRangeSelectionArea(
    fRangeSelectiondimensions: (startRow: number, endRow: number, startColumn: number, endColumn: number) => any,
    startRow: number,
    endRow: number,
    startColumn: number,
    endColumn: number
  ) {
    let selectionArea = fRangeSelectiondimensions(
      startRow,
      endRow,
      startColumn,
      endColumn
    );
    let selectionAreaHighlighter = document.getElementById(
      `selection-area-table-${tableNumberOnPage}`
    );
    let selectionAreaBorders = {
      left: parseFloat(
        window.getComputedStyle(selectionAreaHighlighter as HTMLElement).borderLeftWidth
      ),
      top: parseFloat(
        window.getComputedStyle(selectionAreaHighlighter as HTMLElement).borderTopWidth
      ),
    };
    let startCellX = table.rows[startRow].cells[startColumn].offsetLeft;
    let startCellY = table.rows[startRow].cells[startColumn].offsetTop;
    Object.assign((selectionAreaHighlighter as HTMLElement).style, {
      display: "",
      left: `${startCellX - selectionAreaBorders.left}px`,
      top: `${startCellY - selectionAreaBorders.top}px`,
      width: `${selectionArea.width}px`,
      height: `${selectionArea.height}px`,
    });
    selectionRangeHighlighter = true;
    //table.appendChild(selectionAreaHighlighter);
  }
  function calculateRangeSelectionDimestions(startRow: number, endRow: number, startColumn: number, endColumn: number) {
    let rangeSelectionHeight = 0;
    for (let row = startRow; row <= endRow; row++) {
      // if a filter is applied a whole row is hidden so the height is gonna be zero
      // no need to control flow here (if row !hidden then add height)
      rangeSelectionHeight += table.rows[row].cells[startColumn].getBoundingClientRect().height;
      if (table.rows[row].style.display != "none"){
        table.rows[row].cells[startColumn].classList.add("selected-range")
      }
    }
    let rangeSelectionWidth = 0;
    for (let column = startColumn; column <= endColumn; column++) {
      rangeSelectionWidth += table.rows[startRow].cells[column].getBoundingClientRect().width;
      for (let row = startRow; row <= endRow; row++) {
      if (table.rows[row].style.display != "none"){
        table.rows[row].cells[column].classList.add("selected-range")
      }
    }
        table.rows[startRow].cells[column].classList.add("selected-range")
    }

    class RangeSelectionDimensions {
        width: number;
        height: number;
        x: number;
        y: number;
      constructor(width: number, height: number, x: number, y: number) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
      }
    }
    let rangeSelectionDimensions = new RangeSelectionDimensions( rangeSelectionWidth, rangeSelectionHeight, 0, 0);
    return rangeSelectionDimensions;
  }

  // Spawn a highlighter for a selected range of cells
  let selectionMode = false;
  let rangeSelectionHighlighterStartColumn: number, rangeSelectionHighlighterEndColumn: number;
  let tableBody = table.querySelector("tbody");
  (tableBody as HTMLElement).addEventListener("mousedown", (event) => {
    if (event.button == 0){
      if ((event.target as HTMLElement).tagName == "TH") {
        return; 
      }
      selectionMode = true;
      let startRow: number, startColumn: number;
      if (typeof table.dataset.sorted !== "undefined") {
        startRow = parseInt((event.target as HTMLElement).dataset.rowSort ?? "");
        startColumn = parseInt((event.target as HTMLElement).dataset.columnSort ?? "");
      } else {
        startRow = parseInt((event.target as HTMLElement).dataset.row ?? "" );
        startColumn = parseInt((event.target as HTMLElement).dataset.column ?? "");
      }
      let startSelectionRow,
        endSelectionRow,
        startSelectionColumn,
        endSelectionColumn;
      function addCelltoSelectionRange(event: Event) {
        if (!selectionMode) {
          return;
        }
        if ((event.target as HTMLElement).tagName == "TD") {
          if (typeof table.dataset.sorted !== "undefined") {
            if (parseInt((event.target as HTMLElement).dataset.rowSort) < startRow) {
              startSelectionRow = parseInt((event.target as HTMLElement).dataset.rowSort);
              endSelectionRow = startRow;
            } else {
              startSelectionRow = startRow;
              endSelectionRow = parseInt((event.target as HTMLElement).dataset.rowSort);
            }
  
            if (parseInt((event.target as HTMLElement).dataset.columnSort) < startColumn) {
              startSelectionColumn = parseInt((event.target as HTMLElement).dataset.columnSort);
              endSelectionColumn = startColumn;
            } else {
              startSelectionColumn = startColumn;
              endSelectionColumn = parseInt((event.target as HTMLElement).dataset.columnSort);
            }
          } else {
            if (parseInt((event.target as HTMLElement).dataset.row) < startRow) {
              startSelectionRow = parseInt((event.target as HTMLElement).dataset.row);
              endSelectionRow = startRow;
            } else {
              startSelectionRow = startRow;
              endSelectionRow = parseInt((event.target as HTMLElement).dataset.row);
            }
  
            if (parseInt((event.target as HTMLElement).dataset.column) < startColumn) {
              startSelectionColumn = parseInt((event.target as HTMLElement).dataset.column);
              endSelectionColumn = startColumn;
            } else {
              startSelectionColumn = startColumn;
              endSelectionColumn = parseInt((event.target as HTMLElement).dataset.column);
            }
            //console.log(startSelectionColumn, startSelectionRow, endSelectionColumn, endSelectionRow)
          }
  
          rangeSelectionHighlighterStartColumn = startSelectionColumn;
          rangeSelectionHighlighterEndColumn = endSelectionColumn;
          drawRangeSelectionArea(
            calculateRangeSelectionDimestions,
            startSelectionRow,
            endSelectionRow,
            startSelectionColumn,
            endSelectionColumn
          );
        }
      }
      table.addEventListener("mouseover", addCelltoSelectionRange);
      window.addEventListener("mouseup", () => {
        selectionMode = false;
        table.removeEventListener("mouseover", addCelltoSelectionRange);
      });
    }
  });
  /*Automatic scroll when approaching the border of the container*/
  const scrollThreshold = 100;

  container.addEventListener("mousedown", (event)=>{
    const firstHeader = table.querySelectorAll("thead th")[0];
    const headerHeight = firstHeader.clientHeight;
    const rowHeaderWidth = firstHeader.clientWidth;

    const scrollSpeed = 10;
    const delay = 25;
    let scrollIntervalV: any, scrollIntervalH: any;
    let containerDim = new tf.TableContainerCoordinates(container)
    function scrollContainer(event: any) {
      clearInterval(scrollIntervalV); // Clear any existing scroll interval
      clearInterval(scrollIntervalH);
      if (event.target.tagName == "TD") {
        let scrollTop = 0;
        let scrollLeft = 0;

        if (event.pageY < containerDim.y + scrollThreshold + headerHeight) {
          scrollIntervalV = setInterval(() => {
            scrollTop -= scrollSpeed;
            container.scrollTop += scrollTop;
          }, delay);
        } else if (event.pageY > containerDim.bottom - scrollThreshold) {
          scrollIntervalV = setInterval(() => {
            scrollTop += scrollSpeed;
            container.scrollTop += scrollTop;
          }, delay);
        } 

        if (event.pageX < containerDim.x + scrollThreshold + rowHeaderWidth) {
          scrollIntervalH = setInterval(() => {
            scrollLeft -= scrollSpeed;
            container.scrollLeft += scrollLeft;
          }, delay);
        } else if (event.pageX > containerDim.right - scrollThreshold) {
          scrollIntervalH = setInterval(() => {
            scrollLeft += scrollSpeed;
            container.scrollLeft += scrollLeft;
          }, delay);
        } 
      }
    }
    container.addEventListener("mousemove", scrollContainer)
    // container.addEventListener("mouseleave", () => {
    //   clearInterval(scrollIntervalV);
    //   clearInterval(scrollIntervalH);
    // });
    container.addEventListener("mouseup", ()=>{
      clearInterval(scrollIntervalV);
      clearInterval(scrollIntervalH);
      container.removeEventListener("mousemove", scrollContainer)
    })
    document.addEventListener("mouseup", ()=>{
      clearInterval(scrollIntervalV);
      clearInterval(scrollIntervalH);
      container.removeEventListener("mousemove", scrollContainer)
    })
  })

  /*Handle right click on range selection*/
  for (let cell of tableCells){
    cell.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      let cellType = Array.from((event.target as HTMLElement).classList) 
      if (cellType.includes("selected-range") || cellType[0] == "selected-cell"){
        let containerCoordinates = new tf.TableContainerCoordinates(container);
        let containerScrollOffset = new tf.TableContainerScrollOffset(container);
        if (event.target === event.currentTarget) {
          let contextMenuOnPage = table.getElementsByClassName("menu-range-selection-context-menu")[0];
          if (typeof contextMenuOnPage !== "undefined") {
            return;
          }
          let contextMenu = tf.makeCustomContextMenuRangeSelection(
            event.pageX - containerCoordinates.x + containerScrollOffset.x,
            event.pageY - containerCoordinates.y + containerScrollOffset.y,
            tableNumberOnPage
          );
          contextMenu.addEventListener('click', (event)=>{
              if ((event.target as HTMLElement).className == "range-selection-context-menu-item"){
                if ((event.target as HTMLElement).dataset.menuFuntion == "1"){
                  let copyString = '';
                  let addLinebreak = false;
                  for (let row of table.rows){
                    for (let cell of row.cells){
                      if (cell.classList.contains("selected-range")){
                        copyString = copyString.concat(cell.textContent as string, "\t") 
                        addLinebreak = true
                      }
                    }
                    if (addLinebreak){
                      copyString += "\n"
                      addLinebreak= false
                    }
                  }
                  navigator.clipboard.writeText(copyString);
                }
              }
             table.removeChild(contextMenu)
          })
          table.appendChild(contextMenu);
        }
      } else {
        // TODO: Add select all 
        // TODO: Add export table 
        // TODO: Add copy all 
      }
    })
  }
  //remove range selection context menu when clicking anywhere on the page 
  document.addEventListener("mousedown", (event) => {
  let contextMenuOnPageAfter = table.getElementsByClassName("menu-range-selection-context-menu")[0];
  if (typeof contextMenuOnPageAfter !== "undefined") {
    if (event.target !== contextMenuOnPageAfter && !contextMenuOnPageAfter.contains(event.target as Node)) {
      (contextMenuOnPageAfter.parentNode as HTMLElement).removeChild(contextMenuOnPageAfter);
    }
  }
});

  /*Resize table*/

  tf.addResizersToTable(table);

  // Output:
  // 0: selected cell and selected resizer in the same column
  // 1: selected resizer is before selected cell
  // -1: there is no selected cell yet
  function findSelectedCellRelativeColumn(element: HTMLElement) {
    if (columnOfSelectedCell === -1) {
      return -1;
    }
    let resizerColumn = parseInt(element.dataset.columnResizer);
    switch (true) {
      case resizerColumn == columnOfSelectedCell:
        return 0;
      case resizerColumn < columnOfSelectedCell:
        return 1;
      default:
        return -1;
    }
  }

  function findSelectionRangeRelativeColumn(element: HTMLElement) {
    if (!selectionRangeHighlighter) {
      return -1;
    }
    let resizerColumn = parseInt(element.dataset.columnResizer ?? "0");
    switch (true) {
      case rangeSelectionHighlighterStartColumn <= resizerColumn &&
        resizerColumn <= rangeSelectionHighlighterEndColumn:
        return 0;
      case resizerColumn < rangeSelectionHighlighterStartColumn:
        return 1;
      default:
        return -1;
    }
  }

  // Resize column with drag and drop
  const tableResizers = table.getElementsByClassName("column-resizers");
  for (let res = 0; res < tableResizers.length; res++) {
    tableResizers[res].addEventListener("mousedown", (event) => {
      let selectorRelativePosition = findSelectedCellRelativeColumn(
        event.target as HTMLElement
      );
      let cellHighlighterPositionX: number, cellHighlighterWidth: number, cellHighlighter: Element;
      if (selectorRelativePosition != -1) {
        cellHighlighter = table.getElementsByClassName("cell-selector")[0];
        cellHighlighterPositionX =
          cellHighlighter.getBoundingClientRect().x + scrollX;
        cellHighlighterWidth = parseFloat(
          window.getComputedStyle(cellHighlighter).width
        );
      }
      let selectionRangeRelativePosition = findSelectionRangeRelativeColumn(event.target as HTMLElement);
      let selectionRangeHighlighterPositionX: number,
        selectionRangeHighlighterWidth: number,
        selectionRangeHighlighterElement: HTMLElement;
      if (selectionRangeRelativePosition != -1) {
        selectionRangeHighlighterElement = document.getElementById(`selection-area-table-${tableNumberOnPage}`)!;
        selectionRangeHighlighterPositionX =
          selectionRangeHighlighterElement.getBoundingClientRect().x + scrollX;
        selectionRangeHighlighterWidth = parseFloat(
          window.getComputedStyle(selectionRangeHighlighterElement).width
        );
      }
      let selectedREsizerColumnIndex = parseInt((event.target as HTMLElement).dataset.columnResizer ?? "0");
      document.body.style.cursor = "col-resize";
      let o = (event as MouseEvent).pageX;
      const tableWidth = parseFloat(window.getComputedStyle(table).width);
      const tableHeaders = Array.from(table.getElementsByTagName("th"));
      const colWidth = parseFloat(
        window.getComputedStyle(tableHeaders[selectedREsizerColumnIndex]).width
      );
      const pageWidth = document.documentElement.scrollWidth;

      window.addEventListener("mousemove", activateResize);
      window.addEventListener("mouseup", disableResize);
      let containerScrollOffset = new tf.TableContainerScrollOffset(container);
      function activateResize(event: MouseEvent) {
        let newWidth = event.pageX - o;
        var newTableWidth = tableWidth + newWidth;
        var newColWidth = colWidth + newWidth;
        if (newColWidth > 30 /*&& newTableWidth < pageWidth - 20*/) {
          table.style.width = `${newTableWidth}px`;
          tableHeaders[
            selectedREsizerColumnIndex
          ].style.width = `${newColWidth}px`;
          if (selectorRelativePosition == 0) {
            (cellHighlighter as HTMLElement).style.width = `${
              cellHighlighterWidth + newWidth
            }px`;
          } else if (selectorRelativePosition == 1) {
            //for some reason the postion detects the first sub-pixel but the width doesnt
            (cellHighlighter as HTMLElement).style.left = `${cellHighlighterPositionX + containerScrollOffset.x - containerDimensions.x + newWidth}px`;
          }

          if (selectionRangeRelativePosition == 0) {
            selectionRangeHighlighterElement.style.width = `${
              selectionRangeHighlighterWidth + newWidth
            }px`;
          } else if (selectionRangeRelativePosition == 1) {
            selectionRangeHighlighterElement.style.left = `${selectionRangeHighlighterPositionX + containerScrollOffset.x - containerDimensions.x + newWidth}px`;
          }
        }
      }
      function disableResize() {
        document.body.style.cursor = "auto";
        window.removeEventListener("mousemove", activateResize);
      }
    });
  }

  // custom context menu when right click on the table headers

  let tableHeaders = table.getElementsByTagName("th");
  for (let header of tableHeaders) {
    
    header.addEventListener("contextmenu", (event) => {
        if (typeof header.dataset.header !== 'undefined'){
          let containerCoordinates = new tf.TableContainerCoordinates(container);
          let containerScrollOffset = new tf.TableContainerScrollOffset(container);
          //console.log(tableContainerScrollY);
          event.preventDefault();
          if (event.target === event.currentTarget) {
            let contextMenuOnPage = table.getElementsByClassName("menu-filter-context-menu")[0];
            if (typeof contextMenuOnPage !== "undefined") {
            }
            let contextMenu = tf.makeCustomContextMenu(
              event.pageX - containerCoordinates.x + containerScrollOffset.y,
              event.pageY - containerCoordinates.y + containerScrollOffset.y,
              tableNumberOnPage
            );
            table.appendChild(contextMenu);
          }
        }
      }, true);
  }
  document.addEventListener("mousedown", (event) => {
    let contextMenuOnPageAfter = table.getElementsByClassName(
      "menu-filter-context-menu"
    )[0];
    if (typeof contextMenuOnPageAfter !== "undefined") {
      if (event.target !== contextMenuOnPageAfter && !contextMenuOnPageAfter.contains(event.target as Node)) {
        contextMenuOnPageAfter.parentNode!.removeChild(contextMenuOnPageAfter);
      }
    }
  });
  //debug filter here
  //createFiltersForTable(table, container, tableNumberOnPage);
  // add events to the menu elements of the custom context menu of the header
  // show checkboxes of column values filters
  const filterSpawners = container.getElementsByClassName("table-filters");
  for (let filterSpawner of filterSpawners) {
    filterSpawner.addEventListener("click", () => {
      let numberAppliedFilters = ff.countActiveFiltersOnTable(Array.from(filterSpawners) as HTMLDivElement[]);
      if (numberAppliedFilters == 1 && (filterSpawner as HTMLElement).dataset.filterApplied == "1"){
        let allColumnValues = ff.createSortedUniqueArrayFromTableColumn(table, parseInt((filterSpawner as HTMLElement).dataset.columnFilter), false);
        let uniqueColumValuesList = ff.createCheckboxListFromArray(
          allColumnValues,
          'm-table-filter-cb-child-item', 
          'm-table-filter-cb-parent-item',
          'm-table-filter-cb-parent-list',
          'm-table-filter-cb-children-list', 
          tableNumberOnPage, 
          parseInt((filterSpawner as HTMLElement).dataset.columnFilter))
        container.getElementsByClassName('column-distinct-area')[parseInt((filterSpawner as HTMLElement).dataset.columnFilter) - 1].textContent = '';
        container.getElementsByClassName('column-distinct-area')[parseInt((filterSpawner as HTMLElement).dataset.columnFilter) - 1].appendChild(uniqueColumValuesList);
        ff.checkAndUncheckFilterCheckboxex(
          container.getElementsByClassName('column-distinct-area')[parseInt((filterSpawner as HTMLElement).dataset.columnFilter) - 1].firstChild as HTMLDivElement, 
          table, 
          parseInt((filterSpawner as HTMLElement).dataset.columnFilter))
      }
    });
  }
  table.addEventListener("click", (event) => {
    const contextMenuOnPage = table.getElementsByClassName("menu-filter-context-menu")[0];
    const filterSpawners = container.getElementsByClassName("table-filters");
    if (typeof contextMenuOnPage !== "undefined") {
      if ((event.target as HTMLElement).className === "filter-context-menu-item") {
        if ((event.target as HTMLElement).dataset.menuFuntion == "0") {
          if (table.getElementsByClassName("table-filters").length > 0){
            let cbListContainers = container.querySelectorAll('.column-distinct-area');
            for (let row = 1; row < table.rows.length; row++){
              table.rows[row].style.display = '';
            } 
            for (let f =  filterSpawners.length - 1; f > -1; f--){
              let filteredValuesInColumn = ff.createSortedUniqueArrayFromTableColumn(table, f + 1, false)
              let availableValuesForNonfilteredColumns = ff.createCheckboxListFromArray(filteredValuesInColumn,
              'm-table-filter-cb-child-item',
              'm-table-filter-cb-parent-item',
              'm-table-filter-cb-parent-list',
              'm-table-filter-cb-children-list', 
              tableNumberOnPage, 
              f + 1
              );
              cbListContainers[f].textContent = '';
              cbListContainers[f].appendChild(availableValuesForNonfilteredColumns);

              (filterSpawners[f] as HTMLElement).dataset.filterApplied = "0";
              filterSpawners[f].parentNode.removeChild(filterSpawners[f])
            }
          }
          table.removeChild(contextMenuOnPage);
        } else if ((event.target as HTMLElement).dataset.menuFuntion == "1") {
          tf.createFiltersForTable(table, container, tableNumberOnPage);
          table.removeChild(contextMenuOnPage);
        }
      }
    }
  })
  return table;
}

//var mTable = createTable(8, 20, 1000, 'mino', 'm-table',1);
//document.body.appendChild(mTable);

let mt = new tf.MTable(document.getElementById('m-table-host-demo'), data.tHeaders, data.tRows);
mt.spawnMTable();




