export default function test_export(){
  console.log('Imported filter_functions')
}
export function sortTable(table: HTMLTableElement, n: number, dir: number) {
  var  rows: any, 
       switching: boolean, 
       i: number, 
       x: any, 
       y: any, 
       shouldSwitch: boolean, 
       dir: number, 
       switchcount = 0;
  switching = true;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 1; i < (rows.length - 1); i++) {
      shouldSwitch = false;
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      if (dir == 1) {
        if (x.innerHTML.toLowerCase().localeCompare(y.innerHTML.toLowerCase(), undefined, {numeric: true, sensitivity: 'base'}) > 0) {
          shouldSwitch = true;
          break;
        }
      } else if (dir == -1) {
        if (x.innerHTML.toLowerCase().localeCompare(y.innerHTML.toLowerCase(), undefined, {numeric: true, sensitivity: 'base'}) < 0) {
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount ++;
    } 
  }
  table.dataset.sorted = "1";
  for (let r = 1; r < table.rows.length ; r++){
    for(let c = 0; c < table.rows[r].cells.length; c++){
      table.rows[r].cells[c].dataset.rowSort = "r";
      table.rows[r].cells[c].dataset.columnSort = `${c + 1}`;
    }
  }
}

function sortaAplhanumeric (array: any[]){
  return array.sort(new Intl.Collator('de').compare);
};


function makeCheckboxListItem(label: string, childrenItemsClass: string, id: string, checked: boolean){
  let checkboxContainer = document.createElement('li');
  checkboxContainer.className = childrenItemsClass;
  checkboxContainer.role = 'filter-element';
  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = id;
  checkbox.checked = checked;
  // checkbox.name = 'myCheckbox';
  let cbLabel = document.createElement('label');
  cbLabel.htmlFor = id;
  cbLabel.appendChild(document.createTextNode(label));
  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(cbLabel);
  return checkboxContainer;
}

export function createCheckboxListFromArray(data: any[], childrenItemsClass: string, parentItemClass: string, parentListClass: string, childrenListCalss: string, tableNumberOnPage: number, colNumber: number){
  let parentList = document.createElement('ul');
  parentList.className = parentListClass;
  parentList.role = 'filter-element';
  let selectAllNode = parentList.appendChild(makeCheckboxListItem('Select All', parentItemClass,`mt-${tableNumberOnPage}-sa-${colNumber}-cb`, true));
  let childrenList = document.createElement('ul'); 
  childrenList.className = childrenListCalss;
  childrenList.role = 'filter-element';
  selectAllNode.appendChild(childrenList);
  for (let [index, element] of data.entries()){
    childrenList.appendChild(makeCheckboxListItem(element,childrenItemsClass ,`mt-${tableNumberOnPage}-c-${colNumber}-cb-${index + 1}`, true));
  }
  parentList.appendChild(selectAllNode);
  let selectAllCheckbox = parentList.firstChild.firstChild;
  let checkboxChildrenList = childrenList.children;
  selectAllCheckbox.addEventListener('change', () => {
    if ((selectAllNode.firstChild as HTMLInputElement).checked){
      for (let childCheckbox of checkboxChildrenList){
        if ((childCheckbox as HTMLElement).style.display != 'none'){
          (childCheckbox.firstChild as HTMLInputElement).checked = true;
        }
      };
    } else{
      for (let childCheckbox of checkboxChildrenList){
        (childCheckbox.firstChild as HTMLInputElement).checked = false;
      };
    };
  });

  for (let childCheckbox of childrenList.children){
    childCheckbox.firstChild.addEventListener('change', () => {
      let numberChildrenCheckboxesChecked = 0; 
      for (let childCheckbox of checkboxChildrenList){
        if((childCheckbox.firstChild as HTMLInputElement).checked){
          numberChildrenCheckboxesChecked++;
        };
      };
      if (numberChildrenCheckboxesChecked == checkboxChildrenList.length){
        (selectAllCheckbox as HTMLInputElement).indeterminate = false;
        (selectAllCheckbox as HTMLInputElement).checked = true;
      } else if ( numberChildrenCheckboxesChecked > 0 && numberChildrenCheckboxesChecked < checkboxChildrenList.length) {
        (selectAllCheckbox as HTMLInputElement).indeterminate = true;
        (selectAllCheckbox as HTMLInputElement).checked = false;
      } else {
        (selectAllCheckbox as HTMLInputElement).indeterminate = false;
        (selectAllCheckbox as HTMLInputElement).checked = false;
      };
    });
  };
  return parentList;
}

export function searchCheckboxListItems(
  container: HTMLDivElement, 
  tableNumberOnPage:number, 
  colNumber: number, 
  searchTerm: string){
  let cbListContainers = container.getElementsByClassName('column-distinct-area'); 
  let cbList;
  for (let cbListContainer of cbListContainers){
    if ((cbListContainer as HTMLElement).dataset.ownerTable == String(tableNumberOnPage) 
      && (cbListContainer as HTMLElement).dataset.forColumn == String(colNumber)){
      cbList = cbListContainer.firstChild;
    }
  }
  let event = new Event('change', { bubbles: true });
  let childrenCheckboxList = (cbList.firstChild as HTMLElement).children[2].children;
  for (let childCheckbox of childrenCheckboxList){    
    childCheckbox.firstChild.dispatchEvent(event);
    if (!childCheckbox.children[1].textContent.toUpperCase().includes(searchTerm.toUpperCase())){
      (childCheckbox as HTMLElement).style.display = 'none';
      //childCheckbox.firstChild.checked = false;
      (childCheckbox.firstChild as HTMLElement).dispatchEvent(event);
    } else {
      (childCheckbox as HTMLElement).style.display = '';
      //childCheckbox.firstChild.checked = true;
      (childCheckbox as HTMLElement).firstChild.dispatchEvent(event);
    }
  }
}

function determineIfCheckAll(cbList: HTMLDivElement){
  let selectAllCheckbox = cbList.firstChild.firstChild;
  return (selectAllCheckbox as HTMLInputElement).checked;
}
function determineIfNothingIsChecked(cbList: HTMLDivElement){
  let selectAllCheckbox = cbList.firstChild.firstChild;
  if(!(selectAllCheckbox as HTMLInputElement).checked && !(selectAllCheckbox as HTMLInputElement).indeterminate){
    return true;
  } else {
    return false;
  }
}

function determineSelectedItems(cbList: HTMLDivElement){
  let childrenCheckboxList = (cbList.firstChild as HTMLElement).children[2].children;
  let selectedItems = [];
  for (let childCheckbox of childrenCheckboxList){
    if ((childCheckbox.firstChild as HTMLInputElement).checked){
      selectedItems.push(childCheckbox.children[1].textContent)
    }
  }
  return selectedItems;
}

export function checkAndUncheckFilterCheckboxex(cbList: HTMLDivElement, table: HTMLTableElement, colNumber: number){
  let event = new Event('change', { bubbles: true });
  let childrenCheckboxList = (cbList.firstChild as HTMLElement).children[2].children;
  let allColumnValues = createSortedUniqueArrayFromTableColumn(table, colNumber, true);
  for (let childCheckbox of childrenCheckboxList){
    if (allColumnValues.includes(childCheckbox.children[1].textContent)){
      (childCheckbox.firstChild as HTMLInputElement).checked = true;
      childCheckbox.firstChild.dispatchEvent(event);
    } else {
      (childCheckbox.firstChild as HTMLInputElement).checked = false;
      childCheckbox.firstChild.dispatchEvent(event);
    }
  }
}

export function createSortedUniqueArrayFromTableColumn (table: HTMLTableElement, columnNumber: number, isFiltered: boolean): string[]{
  let sortedUniqueColumnValues: Set<string> = new Set();
  for(let r = 1; r < table.rows.length; r++){
    if (isFiltered){
      if (table.rows[r].dataset.rowFiltered == "1"){
        sortedUniqueColumnValues.add(table.rows[r].cells[columnNumber].textContent);
      }
    } else {
      sortedUniqueColumnValues.add(table.rows[r].cells[columnNumber].textContent);
    }
  };
  let sortedUniqueColumnValuesArray: string[]
  sortedUniqueColumnValuesArray = Array.from(sortedUniqueColumnValues);
  sortedUniqueColumnValuesArray = sortaAplhanumeric(sortedUniqueColumnValuesArray);
  return sortedUniqueColumnValuesArray;
};

function createUniqueArrayOfavailableValuesInFilteredColumn(table: HTMLTableElement, columnNumber: number, hasFilter: boolean): string[]{
  let uniqueColumnValues: Set<string> = new Set();
  for(let r = 1; r < table.rows.length; r++){
    if (hasFilter){
      if (table.rows[r].dataset.rowFiltered == "1"){
        uniqueColumnValues.add(table.rows[r].cells[columnNumber].textContent);
      }
    } else {
      if (table.rows[r].dataset.rowFiltered == "0"){
        uniqueColumnValues.add(table.rows[r].cells[columnNumber].textContent);
      }
    }
  };
  let uniqueColumnValuesArray: string[]
  uniqueColumnValuesArray = Array.from(uniqueColumnValues);
  return uniqueColumnValuesArray;
};

function createSortedUniqueArrayFromFilteredColumn(table: HTMLTableElement, colNumber: number, filteredColumns: number[], filteredConditions: string[]): string[] {
  let sortedUniqueColumnValues: Set<string> = new Set();
  for (let r = 1; r < table.rows.length; r++) {
    if (isFilterConditionInRow(table.rows[r], filteredColumns, filteredConditions)) {
      sortedUniqueColumnValues.add(table.rows[r].cells[colNumber - 1].textContent);
    }
  }
  let sortedUniqueColumnValuesArray: string[] = Array.from(sortedUniqueColumnValues);
  sortedUniqueColumnValuesArray = sortaAplhanumeric(sortedUniqueColumnValuesArray);
  return sortedUniqueColumnValuesArray;
}

// number of active filters on table 
export function countActiveFiltersOnTable(filterSpawners: HTMLDivElement[]): number {
  let activeFilters = 0;
  for (let f = 0; f < filterSpawners.length; f++) {
    if (filterSpawners[f].dataset.filterApplied == "1") {
      activeFilters++;
    }
  }
  return activeFilters;
}
function getFilteredColumns(filterSpawners: HTMLDivElement[], colNumber: number): number[] {
  let columns: number[] = [];
  for (let s = 0; s < filterSpawners.length; s++) {
    if (filterSpawners[s].dataset.filterApplied == "1" && (s + 1) != colNumber) {
      columns.push(s + 1);
    }
  }
  return columns;
}
function getAllFiltersConditions (table: HTMLTableElement, filteredColumns: number[]){
  let filterConditions = new Set();
  for (let r = 1; r < table.rows.length; r++){
    if (table.rows[r].dataset.rowFiltered == "1"){
      let filterCondition = '';
      for (let column of filteredColumns){
        filterCondition = filterCondition.concat(table.rows[r].cells[column -1].textContent);
      }
      filterConditions.add(filterCondition);
    }
  }
  return Array.from(filterConditions);
}

function isFilterConditionInRow(tableRow: HTMLTableRowElement, filteredColumns: number[], filteredConditions: string[]){
  let isInRow = false;
  let currentFilterCondition = '';
  for(let columnIndex of filteredColumns){
    currentFilterCondition = currentFilterCondition.concat(tableRow.cells[columnIndex - 1].textContent);
  }
  if (filteredConditions.includes(currentFilterCondition)){
    isInRow = true;
  }
  return isInRow;
}

function getValuesAvailableForCheckboxFilter(table: HTMLTableElement, currentColumn: number, filteredColumns: number[]): string[] {
  let valuesInFilter: string[] = createSortedUniqueArrayFromTableColumn(table, currentColumn, true);
  let allColumnValues: string[] = createSortedUniqueArrayFromTableColumn(table, currentColumn, false);
  let availableValues: string[] = allColumnValues.filter((value) => {
    return !valuesInFilter.includes(value);
  });
  let valuesToAdd: Set<string> = new Set();

  for (let row = 1; row < table.rows.length; row++) {
    let countConditions = 0;
    if (availableValues.includes(table.rows[row].cells[currentColumn - 1].textContent)) {
      for (let column of filteredColumns) {
        let filteredValuesInColumn: string[] = createSortedUniqueArrayFromTableColumn(table, column, true);
        if (filteredValuesInColumn.includes(table.rows[row].cells[column - 1].textContent)) {
          countConditions++;
        }
      }
      if (countConditions > 0) {
        valuesToAdd.add(table.rows[row].cells[currentColumn - 1].textContent);
      }
    }
  }
  return Array.from(valuesToAdd);
}

export function applyFilter(container: HTMLDivElement, table: HTMLTableElement, tableNumberOnPage: number, colNumber: number){
  if (determineIfNothingIsChecked(container.querySelectorAll('.column-distinct-area')[colNumber - 1].firstChild as HTMLDivElement)){
    return;
  }
  let filterSpawners = container.querySelectorAll('.table-filters');
  let cbListContainers = container.querySelectorAll('.column-distinct-area');
  let filteredData = new Map();
  for (let filterSpawner of filterSpawners){
    if ((filterSpawner as HTMLElement).dataset.filterApplied == "1" && filterSpawner != filterSpawners[colNumber - 1]){
      let cbList = cbListContainers[parseInt((filterSpawner as HTMLElement).dataset.columnFilter) - 1].firstChild as HTMLInputElement;
      if(!determineIfCheckAll(cbList)){
        let selectedFilters = determineSelectedItems(cbList); 
        //console.log('col:', colNumber - 1, 'selected: ', selectedFilters)
        filteredData.set((filterSpawner as HTMLElement).dataset.columnFilter, selectedFilters);
      }
    }
  }
  //console.log('Filtered Data', filteredData)
  let filterSpawnerCurrent = filterSpawners[colNumber - 1] as HTMLElement;
  filterSpawnerCurrent.dataset.filterApplied = "1";
  // filterSpawner.dataset.lastFilterApplied = 1;
  let selectedFilterItems = determineSelectedItems(container.getElementsByClassName('column-distinct-area')[colNumber - 1].firstChild as HTMLDivElement);
  //console.log(selectedFilterItems)
  let checkAll = determineIfCheckAll(container.getElementsByClassName('column-distinct-area')[colNumber - 1].firstChild as HTMLDivElement);
  if (checkAll){
    filterSpawnerCurrent.dataset.filterApplied = "0";
  }
  let numberOfIncludingInColumn;
  for (let row = 1; row < table.rows.length; row++){
    numberOfIncludingInColumn = 0; 
    if (selectedFilterItems.includes(table.rows[row].cells[colNumber].textContent)){
       numberOfIncludingInColumn++;
     }
    for (let [column, values] of filteredData){
      if (values.includes(table.rows[row].cells[column].textContent)){
        numberOfIncludingInColumn++;
      }
    }
    //console.log(numberOfIncludingInColumn)
    if(numberOfIncludingInColumn == filteredData.size + 1 ){
        table.rows[row].style.display = '';
        table.rows[row].dataset.rowFiltered = "1";
    } else {
        table.rows[row].style.display = 'none';
        table.rows[row].dataset.rowFiltered = "0";
        // if (selectedFilterItems.includes(table.rows[row].cells[colNumber].textContent)){
        //   table.rows[row].style.display = '';
        //   table.rows[row].dataset.rowFiltered = 1;
        // }
    } 
  }
  for (let filterSpawner of filterSpawners){
    let filterColumn = parseInt((filterSpawner as HTMLElement).dataset.columnFilter);
    if ((filterSpawner as HTMLElement).dataset.filterApplied == "0"  && filterSpawner != filterSpawnerCurrent){
      let cbListContainer = cbListContainers[filterColumn - 1];
      //let filteredValuesInColumn = createUniqueArrayOfavailableValuesInFilteredColumn(table, filterColumn, true);
      let filteredValuesInColumn = createSortedUniqueArrayFromTableColumn(table, filterColumn, true)
      let availableValuesForNonfilteredColumns = createCheckboxListFromArray(filteredValuesInColumn,
      'm-table-filter-cb-child-item',
      'm-table-filter-cb-parent-item',
      'm-table-filter-cb-parent-list',
      'm-table-filter-cb-children-list', 
      tableNumberOnPage, 
      filterColumn
      );
      cbListContainer.textContent = '';
      cbListContainer.appendChild(availableValuesForNonfilteredColumns);
    }
  }
  if (checkAll){
    let cbListContainer = cbListContainers[colNumber - 1];
    let filteredValuesInColumn = createSortedUniqueArrayFromTableColumn(table, colNumber, true)
    let availableValuesForNonfilteredColumns = createCheckboxListFromArray(filteredValuesInColumn,
    'm-table-filter-cb-child-item',
    'm-table-filter-cb-parent-item',
    'm-table-filter-cb-parent-list',
    'm-table-filter-cb-children-list',
    tableNumberOnPage, 
    colNumber
    );
    cbListContainer.textContent = '';
    cbListContainer.appendChild(availableValuesForNonfilteredColumns);
    let numberFiltersApllied = 0; 
    let appliedColumns = []
    for (let filterSpawner of filterSpawners){
      if ((filterSpawner as HTMLElement).dataset.filterApplied == "1"){
        numberFiltersApllied++
        appliedColumns.push(parseInt((filterSpawner as HTMLElement).dataset.columnFilter))
      }
    }
    if (numberFiltersApllied == 1){
      let column = appliedColumns[0]
      let cbListContainer = cbListContainers[column - 1];
      let filteredValuesInColumn = createSortedUniqueArrayFromTableColumn(table, column, false)
      let availableValuesForNonfilteredColumns = createCheckboxListFromArray(filteredValuesInColumn,
      'm-table-filter-cb-child-item',
      'm-table-filter-cb-parent-item',
      'm-table-filter-cb-parent-list',
      'm-table-filter-cb-children-list', 
      tableNumberOnPage, 
      column
      );
      cbListContainer.textContent = '';
      cbListContainer.appendChild(availableValuesForNonfilteredColumns);
      checkAndUncheckFilterCheckboxex(cbListContainers[column - 1].firstChild as HTMLDivElement, 
      table, 
      column)
      }
    }

  if (filterSpawnerCurrent.dataset.filterApplied == "1"){
    filterSpawnerCurrent.style.backgroundImage = 'url(./assets/filter-tick-filled-svgrepo-com.svg)';
  } else {
    filterSpawnerCurrent.style.backgroundImage = 'url(./assets/filter-add-svgrepo-com.svg)';
  }

  
  }
