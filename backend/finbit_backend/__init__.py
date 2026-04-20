try:
	import pymysql

	pymysql.install_as_MySQLdb()
except Exception:
	# mysqlclient can still be used when available.
	pass
