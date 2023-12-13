import Navbar from "../../component/organisms/navbar/Navbar";
import styles from "./RetroCreateView.module.scss";
import {Button} from "../../component/atoms/button/Button";
import AddIcon from "../../assets/icons/add-icon.svg";
import ActionIconSvg from "../../assets/icons/action-icon.svg";
import {ColumnCreate} from "../../component/molecules/column_create/ColumnCreate";
import React, {useEffect, useState} from "react";
import {v4 as uuidv4} from "uuid";
import * as qs from 'query-string';
import {Navigate, useNavigate} from "react-router";
import {getRandomTemplate} from "../../api/retro_template/RetroTemplate.service";
import {ProgressBar} from "../../component/atoms/progress_bar/ProgressBar";
import {createRetro} from "../../api/retro/Retro.service";
import {getRandomColor} from "../../common/Util";
import {RetroCreateRequest} from "../../api/retro/Retro.interface";
import {toast} from "react-toastify";

export interface Column {
  id: string;
  color: string;
  name: string;
  desc: string | null;
}

interface RawColumn {
  color: string;
  name: string;
  desc: string | null;
}

const MAX_COLUMNS = 6

export const RetroCreateView: React.FC = () => {
  const [clicked,setClicked] = useState(false);
  const params = qs.parse(location.search)
  const teamId: string = params.teamId as string
  if (!teamId) {
    return <Navigate to={"/"}/>
  }

  const [columns, setColumns] = useState<Array<Column>>([]);
  const [templateId, setTemplateId] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    randomizeTemplate()
  }, [])

  const onAddColumn = () => {
    const column = {
      id: uuidv4(),
      color: getRandomColor(),
      name: "",
      desc: "",
    };

    setColumns([...columns, column]);
  };

  const onChangeColumn = (
      id: string,
      column: RawColumn
  ) => {
    const columnIndex = columns.findIndex((column) => column.id === id);
    if (columnIndex === -1) return;

    let columnsTemp = Array<Column>();

    columns.forEach((_column, index) => {
      if (index !== columnIndex) {
        columnsTemp.push(_column);
        return;
      }

      columnsTemp.push({
        id: id,
        ...column,
      });
    });

    setColumns(columnsTemp);
  };

  const onDeleteColumn = (id: string) => {
    const columnIndex = columns.findIndex((column) => column.id === id);

    const newColumns = [...columns]
    newColumns.splice(columnIndex, 1)

    setColumns(newColumns);
  };

  const onCreateRetroClick = async () => {
    setClicked(true);

    const request: RetroCreateRequest = {
      teamId: teamId,
      columns: columns
    }

    createRetro(request)
        .then((retro) => {
          const retroUrl = `${window.location.host}/retro/${retro.data.id}`

          navigator.clipboard?.writeText(retroUrl)
              .catch(console.log)

          navigate(`/retro/${retro.data.id}`)
        })
        .catch((e) => {
          console.log(e)
          toast.error('Wystąpił błąd')
          setClicked(false)
          navigate('/')
        })
  }

  const randomizeTemplate = () => {
    getRandomTemplate(templateId)
        .then(template => {
          setTemplateId(template.id)
          setColumns(template.columns.map(col => ({
            id: uuidv4(),
            name: col.name,
            desc: col.desc,
            color: col.color,
          })))
        })
        .catch(console.log)
  }

  return (
      <>
        <Navbar topContent={
          <Button size={"small"} onClick={() => randomizeTemplate()}>
            Losuj szablon
          </Button>
        }/>

        <div className={styles.container}>
          <div className={styles.columns}>
            {columns.map(column =>
                <ColumnCreate
                    key={column.id}
                    onChange={({color, name, desc}) =>
                        onChangeColumn(column.id, {color, name, desc})
                    }
                    onDelete={() => onDeleteColumn(column.id)}
                    color={column.color}
                    name={column.name}
                    desc={column.desc ?? ""}
                    withDescription
                />
            )}

            <div className={styles.columnButton}>
              <Button disabled={columns.length >= MAX_COLUMNS} size="big" onClick={onAddColumn}>
                <span>Nowa Kolumna</span>
                <AddIcon />
              </Button>
            </div>
          </div>

          <div className={styles.actionWrapper}>
            <Button className={styles.actionButton} onClick={onCreateRetroClick}>
              <div className={styles.buttonSection}>
                <span>Akcja</span>
                (Zacznij & skopiuj link)
              </div>
              {clicked
                  ? <ProgressBar color="black"/>
                  : <ActionIconSvg />
              }
            </Button>
          </div>
        </div>
      </>
  );
};
